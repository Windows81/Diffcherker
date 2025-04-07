export default function arrayFirstOrSelf<T>(input: T | T[]): T {
  if (Array.isArray(input)) {
    return input[0];
  }
  return input;
}
