import { WorkerPool as Worker } from './WorkerPool';
import type { gitDiff, gitDiffFileMeta } from './gitDiffWorker';

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export class GitDiffWorkerPool {
  workerPool: Worker;

  constructor() {
    // N.B. Webpack is dumb and provides no reasonable way to generate a
    // worker chunk without the magic `new Worker(...)` syntax. So here
    // `Worker` actually refers to `WorkerPool` but webpack does what we
    // need and stuffs in the URL to the worker bundle.
    this.workerPool = new Worker(new URL('./gitDiffWorker', import.meta.url));
  }

  async gitDiffFileMeta(
    ...args: Parameters<typeof gitDiffFileMeta>
  ): Promise<UnwrapPromise<ReturnType<typeof gitDiffFileMeta>>> {
    // TODO(@izaakschroeder): Should there be runtime type guards?
    const [name, data] = args;
    const res = await this.workerPool.invoke('gitDiffFileMeta', [
      name,
      data.map((x) => (x ? x.subarray(0, 1024) : null)),
    ]);
    return res as ReturnType<typeof gitDiffFileMeta>;
  }

  async gitDiff(
    ...args: Parameters<typeof gitDiff>
  ): Promise<UnwrapPromise<ReturnType<typeof gitDiff>>> {
    // TODO(@izaakschroeder): Should there be runtime type guards?
    // TODO(@izaakschroeder): Fix transfers properly. You cannot return
    // the original and need to reset it:
    // See: https://stackoverflow.com/questions/20738845/
    const res = await this.workerPool.invoke('gitDiff', args);
    return res as ReturnType<typeof gitDiff>;
  }
}
