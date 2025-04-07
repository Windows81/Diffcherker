interface WorkerRecord {
  worker: Worker;
  lastActivityAt: number;
}

interface InvokeOptions {
  /**
   * Any data to transfer to the invocation.
   */
  transfer?: Transferable[];

  /**
   * How many ms to wait before terminating the invocation.
   */
  timeout?: number;

  /**
   * Entries with lower priority are run first.
   */
  priority?: number;

  /**
   * Signal to indicate invocation is to be aborted.
   */
  signal?: AbortSignal;
}

interface QueueEntry {
  id: string;
  fn: string;
  args: unknown[];
  opts?: InvokeOptions;
  resolve: (obj: unknown) => void;
  reject: (obj: unknown) => void;
}

type InvokeResult = Promise<unknown> & { id: string };

interface PendingEntry {
  worker: WorkerRecord;
  entry: QueueEntry;
  timeout: NodeJS.Timeout;
}

/**
 * When returning data from a worker method you may assign this as part
 * of the result and the given objects will be transferred to the
 * caller.
 */
export const transferSymbol = Symbol('transfer');

const getDefaultConcurrency = () => {
  if (typeof navigator !== 'undefined') {
    if (navigator.hardwareConcurrency) {
      return navigator.hardwareConcurrency;
    }
  }
  return 4;
};

interface WorkerPoolOptions {
  /**
   * The maximum number of worker threads to spawn, they will only get
   * spawned if actually needed. By default use ULTRA concurrency to
   * have ULTIMATE DIFF CHECKING SPEED.
   */
  maxWorkers?: number;

  /**
   * The interval of milliseconds at which to check if the pool can be
   * automatically terminated, to free up resources, workers will be
   * spawned up again if needed.
   */
  autoTerminate?: number;

  /**
   * Name of the worker pool, useful for debugging purposes.
   */
  name?: string;
}

/**
 * A flexible pool for `Worker` instances.
 */
export class WorkerPool {
  maxWorkers: number;
  autoTerminate: number;

  name: string | undefined;

  /**
   * URL of the worker file. This file must invoke `createWorker` with
   * the methods to be exported.
   */
  workerUrl: URL;

  /**
   * List of all the workers and their associated metadata.
   */
  workers: WorkerRecord[] = [];

  /**
   * Queued up entries to be executed. The first-most entries are
   * executed first.
   */
  queue: QueueEntry[] = [];

  /**
   * Entries that have started executing but are awaiting a response.
   */
  pending: Record<string, PendingEntry> = {};

  /**
   * Timer that periodically checks for idle workers and kills them.
   */
  idleReaper: NodeJS.Timeout;

  queueDirty = false;

  constructor(workerUrl: URL, options?: WorkerPoolOptions) {
    this.workerUrl = workerUrl;
    this.maxWorkers = options?.maxWorkers ?? getDefaultConcurrency();
    this.autoTerminate = options?.autoTerminate ?? 60000;
    this.name = options?.name;
    this.idleReaper = setInterval(() => {
      const now = Date.now();
      let reason;
      for (const worker of this.workers) {
        if (this.isWorkerActive(worker)) {
          continue;
        }
        if (now - worker.lastActivityAt > this.autoTerminate) {
          reason ??= new Error('Idle termination');
          this.removeWorker(worker, reason);
        }
      }
    }, 10000);
  }

  isRunning(id: string) {
    return !!this.pending[id];
  }

  setPriority(id: string, priority: number) {
    if (this.isRunning(id)) {
      return;
    }
    for (const entry of this.queue) {
      if (entry.id === id) {
        entry.opts ??= {};
        entry.opts.priority = priority;
        this.queueDirty = true;
      }
    }
  }

  /**
   * Invoke a worker function,
   * @param fn Name of the function.
   * @param args Arguments to the function.
   * @param opts Additional options.
   * @returns Promise resolving with the invoked function.
   */
  invoke(fn: string, args: unknown[], opts?: InvokeOptions): InvokeResult {
    const id = `${Math.random().toString(36).substring(2)}-${Date.now()}`;
    const promise = new Promise((resolve, reject) => {
      const finalize = () => {
        if (!this.pending[id]) {
          return;
        }
        clearTimeout(this.pending[id].timeout);
        delete this.pending[id];
      };
      const entry = {
        id,
        fn,
        args,
        opts,
        resolve: (v: unknown) => {
          finalize();
          resolve(v);
        },
        reject: (v: unknown) => {
          finalize();
          reject(v);
        },
      };
      this.queue.push(entry);
      opts?.signal?.addEventListener('abort', () => {
        entry.reject(new DOMException('Aborted', 'AbortError'));
        const idx = this.queue.indexOf(entry);
        if (idx >= 0) {
          this.queue.splice(idx, 1);
          this.queueDirty = true;
        }
      });
      this.queueDirty = true;
      this.processQueue();
    }) as InvokeResult;
    promise.id = id;
    return promise;
  }

  /**
   * Stop all workers.
   */
  terminate() {
    clearInterval(this.idleReaper);
    const reason = new Error(`Worker terminated.`);
    for (const worker of this.workers) {
      this.removeWorker(worker, reason);
    }
  }

  isWorkerActive(worker: WorkerRecord) {
    for (const key in this.pending) {
      if (this.pending[key].worker === worker) {
        return true;
      }
    }
    return false;
  }

  processQueue() {
    loop: while (this.queue.length > 0) {
      for (const entry of this.workers) {
        if (!this.isWorkerActive(entry)) {
          // use idle worker
          this.popQueue(entry);
          continue loop;
        }
      }
      if (this.workers.length <= this.maxWorkers) {
        this.addWorker();
        continue loop;
      }
      // All workers are busy and we've reached max workers.
      return;
    }
  }

  onError(err: unknown) {
    // TODO(@izaakschroeder): Do something more useful than this.
    // Possibly add an event emitter and allow people to subscribe to
    // an `error` event or something.
    console.error(err);
  }

  /**
   * Get the next item in the queue for execution.
   * @returns An entry from the queue, if present.
   */
  popQueue(record: WorkerRecord) {
    if (this.queueDirty) {
      // TODO(@izaakschroeder): Consider making this a proper heap
      // instead of just using `sort`. Also `sort` seems to be stable
      // per https://v8.dev/features/stable-sort.
      this.queue.sort((a, b) => {
        return (a.opts?.priority ?? 0) - (b.opts?.priority ?? 0);
      });
      this.queueDirty = false;
    }
    const entry = this.queue.shift();
    if (entry) {
      this.pending[entry.id] = {
        worker: record,
        entry,
        timeout: setTimeout(() => {
          entry.reject(new Error(`Timeout`));
        }, 10000),
      };
      entry.opts?.signal?.addEventListener('abort', () => {
        this.removeWorker(record, new DOMException('Aborted', 'AbortError'));
      });
      record.lastActivityAt = Date.now();
      record.worker.postMessage(
        {
          type: 'EXEC',
          data: {
            id: entry.id,
            fn: entry.fn,
            args: entry.args,
          },
        },
        {
          transfer: entry.opts?.transfer,
        },
      );
      return entry;
    }
  }

  /**
   * Remove a given worker from the pool.
   * @param record The worker to remove.
   */
  removeWorker(record: WorkerRecord, reason: unknown) {
    for (const entry of Object.values(this.pending)) {
      if (entry.worker === record) {
        entry.entry.reject(reason);
      }
    }
    record.worker.terminate();
    const index = this.workers.indexOf(record);
    if (index >= 0) {
      this.workers.splice(index, 1);
    }
  }

  /**
   * Add a new worker to the pool.
   */
  addWorker() {
    const worker = new Worker(this.workerUrl, {
      // N.B. Something about the current version of `next` or
      // `webpack` or the hacky nature that makes this work
      // requires `classic` mode and NOT `module` mode.
      // TODO(@izaakschroeder): Make this `module`.
      type: 'classic',
      name: this.name,
    });
    const workerRecord: WorkerRecord = {
      worker,
      lastActivityAt: Date.now(),
    };
    worker.onerror = (err) => {
      this.onError(err);
      this.removeWorker(workerRecord, err);
    };
    worker.onmessage = (evt) => {
      workerRecord.lastActivityAt = Date.now();
      switch (evt.data.type) {
        case 'EXEC_RESULT':
          const { id, ok, result } = evt.data.data;
          if (!this.pending[id]) {
            return;
          }
          const { entry } = this.pending[id];
          ok ? entry.resolve(result) : entry.reject(result);
          this.popQueue(workerRecord);
          return;
        case 'ERROR':
          this.onError(evt.data.data);
          this.removeWorker(workerRecord, evt.data.data);
          return;
        default:
          const err = {
            code: 'UNKNOWN_MESSAGE_TYPE',
            message: evt.data,
          };
          this.onError(err);
          this.removeWorker(workerRecord, err);
          return;
      }
    };
    this.workers.push(workerRecord);
    this.popQueue(workerRecord);
  }
}

const getTransfer = (result: unknown) => {
  let transfer;
  if (typeof result === 'object' && result && transferSymbol in result) {
    transfer = result[transferSymbol] as Transferable[];
    delete result[transferSymbol];
  }
  return transfer;
};

export const createWorker = (
  g: typeof globalThis,
  // Any is actually the correct type here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  methods: Record<string, (...args: any[]) => any>,
) => {
  g.onmessage = async (evt) => {
    switch (evt.data.type) {
      case 'EXEC':
        const { id, fn, args } = evt.data.data;
        try {
          const result = await methods[fn](...args);
          const transfer = getTransfer(result);
          g.postMessage(
            {
              type: 'EXEC_RESULT',
              data: {
                id,
                result,
                ok: true,
              },
            },
            {
              transfer,
            },
          );
        } catch (err) {
          const transfer = getTransfer(err);
          g.postMessage(
            {
              type: 'EXEC_RESULT',
              data: {
                id,
                result: err,
                ok: false,
              },
            },
            {
              transfer,
            },
          );
        }
        return;
      default:
        g.postMessage({
          type: 'ERROR',
          data: {
            code: 'UNKNOWN_MESSAGE_TYPE',
            message: evt.data,
          },
        });
        return;
    }
  };
};
