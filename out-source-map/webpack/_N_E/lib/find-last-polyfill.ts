// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Array<T> {
  findLast(
    callback: (value: T, index: number, obj: T[]) => boolean,
  ): T | undefined;
}

/**
 * Seems that nextjs isn't including this polyfill by default for older browsers
 *
 * https://github.com/vercel/next.js/discussions/46724
 *
 * This discussion covers some of the confusion. Once this is confirmed added to their
 * polyfill library, we can remove this.
 */
if (!Array.prototype.findLast) {
  Array.prototype.findLast = function <T>(
    this: T[],
    callback: (value: T, index: number, obj: T[]) => boolean,
  ): T | undefined {
    if (this == null) {
      throw new TypeError('this is null or not defined');
    }
    const arr: T[] = Object(this);
    const len = arr.length >>> 0;
    for (let i = len - 1; i >= 0; i--) {
      if (callback(arr[i], i, arr)) {
        return arr[i];
      }
    }
    return undefined;
  };
}
