import { Diff } from 'types/diff';

export function trim({ left = '', right = '' }: Diff): Diff {
  const trimLines = (text: string) =>
    text
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line !== '')
      .join('\n');
  return {
    left: trimLines(left),
    right: trimLines(right),
  };
}
