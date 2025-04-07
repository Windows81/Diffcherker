import { Diff } from 'types/diff';

export function toSpaces({ left = '', right = '' }: Diff): Diff {
  const replace = (text: string) => text.replace(/(\n|\r\n)/g, ' ');
  return {
    left: replace(left),
    right: replace(right),
  };
}
