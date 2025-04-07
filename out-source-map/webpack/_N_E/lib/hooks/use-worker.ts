/* eslint-disable @typescript-eslint/no-explicit-any */
import { captureException } from 'lib/sentry';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CustomWorker,
  WorkerMessageDataTypes,
  workerFactory,
  type WorkerName,
} from 'lib/workers';

import createPromiseWithResolvers from 'lib/create-promise-with-resolvers';

type SerializableErrorInfo = {
  message: string;
  worker: string;
  name?: string;
  stack?: string;
  filenname?: string;
  lineno?: number;
  colno?: number;
  error?: SerializableErrorInfo;
};

export function serializeWorkerError(
  workerName: string,
  error: Error | ErrorEvent,
): SerializableErrorInfo {
  if (error instanceof Error) {
    return {
      message: error.message,
      worker: workerName,
      name: error.name,
      stack: error.stack,
      // You can include any other properties that you think are necessary
      // to help you understand and fix the issue.
    };
  } else {
    return {
      message: error.message,
      worker: workerName,
      filenname: error.filename,
      lineno: error.lineno,
      colno: error.colno,
      error: error.error && serializeWorkerError(workerName, error.error),
    };
  }
}

type UseWorkerOptions<U = unknown> = {
  autoTerminate: boolean;
  restartable: boolean;
  setter: (data?: U) => void;
};

const defaultUseWorkerOptions: UseWorkerOptions = {
  autoTerminate: false,
  restartable: false,
  setter: () => {
    /* noop */
  },
};

export class WorkerKilledError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(
      `Worker killed programatically${message ? ': ' : ''}${message}`,
      options,
    );
  }
}

export class WorkerKilledForRestartError extends Error {}

export enum UseWorkerEndStatus {
  COMPLETED,
  RESTARTED,
  KILLED,
}

/**
 * The callback that creates a promise around the worker
 * and returns the value type U
 */
export interface UseWorkerCall<T, U> {
  (
    args: T,
    transfer?: Transferable[] | StructuredSerializeOptions,
  ): Promise<UseWorkerReturnObject<U>>;
}

/**
 * The tuple you get back from
 */
export type UseWorkerHookTuple<T, U> = [
  UseWorkerCall<T, U>,
  boolean,
  ErrorEvent | Error | undefined,
];

export type UseWorkerReturnObject<U> = {
  data: U | undefined;
  status: UseWorkerEndStatus;
};

export const useWorker = <
  P extends WorkerName,
  T extends WorkerMessageDataTypes[P]['args'],
  U extends WorkerMessageDataTypes[P]['data'],
>(
  name: P,
  userOptions: Partial<UseWorkerOptions<U>> = {},
): UseWorkerHookTuple<T, U> => {
  const options: UseWorkerOptions<U> = {
    ...defaultUseWorkerOptions,
    ...userOptions,
  };

  const workerRef = useRef<CustomWorker<T, U>>();
  const promiseWithResolversRef =
    useRef<PromiseWithResolvers<UseWorkerReturnObject<U>>>();
  const isRunningRef = useRef<boolean>(false);
  const setterRef = useRef<(data?: U) => void>();

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [error, setError] = useState<ErrorEvent | Error>();

  const { autoTerminate, restartable, setter } = options;
  setterRef.current = setter;

  const onWorkerStart = useCallback(() => {
    setError(undefined);
    setIsRunning(true);
    isRunningRef.current = true;
  }, []);

  const onWorkerComplete = useCallback((data: U) => {
    promiseWithResolversRef.current?.resolve({
      data,
      status: UseWorkerEndStatus.COMPLETED,
    });
    promiseWithResolversRef.current = undefined;

    if (setterRef.current) {
      setterRef.current(data);
    }
  }, []);

  const killWorker = useCallback((e?: Error | ErrorEvent) => {
    if (e) {
      promiseWithResolversRef.current?.reject(
        new WorkerKilledError(e?.message, { cause: e }),
      );
    } else {
      promiseWithResolversRef.current?.resolve({
        data: undefined,
        status: UseWorkerEndStatus.KILLED,
      });
    }
    promiseWithResolversRef.current = undefined;

    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = undefined;
    }
  }, []);

  const restartWorker = useCallback(() => {
    promiseWithResolversRef.current?.resolve({
      data: undefined,
      status: UseWorkerEndStatus.RESTARTED,
    });

    promiseWithResolversRef.current = undefined;

    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = undefined;
    }
  }, []);

  const onWorkerReset = useCallback(() => {
    if (autoTerminate) {
      killWorker();
    }

    setIsRunning(false);
    isRunningRef.current = false;
  }, [autoTerminate, killWorker]);

  const onWorkerError = useCallback(
    (e: ErrorEvent | Error) => {
      promiseWithResolversRef.current?.reject(e);
      promiseWithResolversRef.current = undefined;

      if (autoTerminate) {
        killWorker();
      }

      setIsRunning(false);
      isRunningRef.current = false;

      setError(e);
    },
    [killWorker, autoTerminate],
  );

  const workerCall = useCallback(
    async (
      args: any,
      transfer?: Transferable[] | StructuredSerializeOptions,
    ): Promise<UseWorkerReturnObject<U>> => {
      if (isRunningRef.current && !restartable) {
        throw new Error(
          `Can't call the worker again while it is currently running. Either pass the 'restartable' option to be true. Or try invoking 'useWorker' again to create a second instance.`,
        );
      }

      if (isRunningRef.current && restartable) {
        restartWorker();
      }

      onWorkerStart();

      const promiseWithResolvers =
        createPromiseWithResolvers<UseWorkerReturnObject<U>>();
      promiseWithResolversRef.current = promiseWithResolvers;

      if (!workerRef.current) {
        workerRef.current = workerFactory<P, T, U>(name);
      }

      workerRef.current.onerror = (e) => {
        // TODO remove this condition once we fix the webworker import issue (we know this is happening so we don't have to capture it)
        if (
          e?.message !==
          "Uncaught TypeError: Cannot read property 'register' of undefined"
        ) {
          captureException(`Error occurred in '${name}' worker (onerror)`, {
            tags: {
              workerName: name,
            },
            extra: {
              workerError: serializeWorkerError(name, e),
            },
          });
        }
        onWorkerError(e);
      };

      workerRef.current.onmessageerror = (messageEvent) => {
        const error = new Error(
          'Error receiving message from worker. Deserialization error.',
          {
            cause: messageEvent,
          },
        );
        captureException(
          `Error occurred in '${name}' worker (onmessageerror)`,
          {
            tags: {
              workerName: name,
            },
            extra: {
              workerError: serializeWorkerError(name, error),
            },
          },
        );
        onWorkerError(error);
      };

      workerRef.current.onmessage = (e) => {
        onWorkerComplete(e.data);
        onWorkerReset();
      };

      const worker = workerRef.current;
      worker.postMessage(args, transfer);

      return promiseWithResolvers.promise;
    },
    [
      name,
      onWorkerComplete,
      onWorkerError,
      onWorkerReset,
      onWorkerStart,
      restartWorker,
      restartable,
    ],
  );

  // Destructor
  useEffect(() => {
    return () => {
      onWorkerReset();
      killWorker();
    };
  }, [name, killWorker, onWorkerReset]);

  return [workerCall, isRunning, error];
};
