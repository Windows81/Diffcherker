import { Diff } from 'types/diff';

export function sortLines({ left, right }: Diff): Diff {
  const sortLines = (text: string = '') => text.split('\n').sort().join('\n');

  return {
    left: sortLines(left),
    right: sortLines(right),
  };
}
