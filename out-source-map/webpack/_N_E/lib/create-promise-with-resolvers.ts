/* eslint-disable @typescript-eslint/no-explicit-any */
export default function createPromiseWithResolvers<
  T,
>(): PromiseWithResolvers<T> {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  // Type assertion to ensure resolve and reject are defined
  return { promise, resolve: resolve!, reject: reject! };
}
