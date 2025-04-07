import { Diff } from 'types/diff';

export function swapSides({ left, right }: Diff): Diff {
  return {
    left: right,
    right: left,
  };
}
