import { Diff } from 'types/diff';
import { DiffSide } from 'types/diffSide';

export function replaceSide(diff: Diff, side: DiffSide, text: string): Diff {
  return {
    ...diff,
    ...{
      [side]: text,
    },
  };
}
