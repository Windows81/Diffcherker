import { Diff } from 'types/diff';

export function toLower({ left = '', right = '' }: Diff): Diff {
  return {
    left: left.toLowerCase(),
    right: right.toLowerCase(),
  };
}
