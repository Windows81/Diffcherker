/* eslint-disable @typescript-eslint/no-explicit-any */
// Define the type of the messages taken and returned by each worker
import { Diff } from 'types/diff';
import { Message } from 'types/webp-conversion-worker';
import { DiffWorkBookRequest } from 'types/xlsx-worker-types';
import { NormalizeDiffInput } from './normalize-worker';
import { RichTextWorkerInput, RichTextDiff } from 'types/rich-text';

export type WorkerMessageDataTypes = {
  normalize: {
    args: NormalizeDiffInput;
    data: Diff;
  };
  xlsx: {
    args: DiffWorkBookRequest;
    data: DiffWorkBookRequest;
  };
  webpConversion: {
    args: Message;
    data: Message;
  };
  richText: {
    args: RichTextWorkerInput;
    data: RichTextDiff;
  };
};

/**
 * Factory Class to allow name => work construction mapping.
 * This allows us to invoke the creation of workers through their name
 * when used by the `useWorker('foo')` hook.
 *
 * The primary reason for this pattern over something dynamic
 * (where the name is directly passed into the URL constructor)
 * is because of how Webpack 5 supports worker instantiation:
 *
 * https://webpack.js.org/guides/web-workers/#syntax
 */
class Workers {
  normalize() {
    return new Worker(new URL('./normalize-worker', import.meta.url));
  }

  xlsx() {
    return new Worker(new URL('./xlsx-worker', import.meta.url));
  }

  webpConversion() {
    return new Worker(new URL('./webp-conversion/worker', import.meta.url));
  }

  richText() {
    return new Worker(new URL('./rich-text-worker', import.meta.url));
  }
}
export type WorkerName = keyof Workers;

// Generic Worker extended from Worker
export interface CustomWorker<T, U> extends Worker {
  postMessage(
    message: T,
    transfer: Transferable[] | StructuredSerializeOptions | undefined,
  ): void;
  onmessage: ((this: CustomWorker<T, U>, ev: MessageEvent<U>) => any) | null;
  onmessageerror:
    | ((this: CustomWorker<T, U>, ev: MessageEvent<U>) => any)
    | null;
}

/**
 * Factory instantiation and factory method for export
 */
const workers = new Workers();

export function workerFactory<
  P extends WorkerName,
  T extends WorkerMessageDataTypes[P]['args'],
  U extends WorkerMessageDataTypes[P]['data'],
>(name: P): CustomWorker<T, U> {
  if (workers[name]) {
    return workers[name]();
  }
  throw new Error(`Unrecognized worker name: ${name}`);
}

export default workers;
