/* eslint-disable @typescript-eslint/no-explicit-any */
// this is taken straight from the library, any types included
export function get(
  obj: Record<string, any>,
  path: string,
  defaultValue: any = path,
): any {
  const pathArray = path.split('.');

  let index = 0;
  const length = pathArray.length;
  let value = obj;

  while (value != null && index < length) {
    value = value[pathArray[index++]];
  }
  return index && index == length ? value : defaultValue;
}
