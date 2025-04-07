import { DiffBlock } from 'types/normalize';
import { Diff } from 'types/diff';
import { type Meta as Row } from 'types/normalize';
import findCharIndexFromRow from './find-char-index-from-row';

export default function addDiffText(
  diff: Diff,
  diffBlocks: DiffBlock[],
  startRow: number,
  endRow: number,
  rows: Row[],
  toModify: 'right' | 'left',
): string {
  const toCopy = toModify === 'left' ? 'right' : 'left';
  const { startChar: toModifyStart } = findCharIndexFromRow(
    diff,
    diffBlocks,
    startRow,
    endRow,
    rows,
    toModify,
  );
  const { startChar: toCopyStart, endChar: toCopyEnd } = findCharIndexFromRow(
    diff,
    diffBlocks,
    startRow,
    endRow,
    rows,
    toCopy,
  );
  const textToModify = diff[toModify] as string;
  const textToCopy = diff[toCopy] as string;
  if (textToModify.length > toModifyStart) {
    return (
      textToModify.substring(0, toModifyStart) +
      textToCopy.substring(toCopyStart, toCopyEnd + 1) +
      textToModify.substring(toModifyStart)
    );
  } else {
    let conditionalLinebreak = '';
    if (textToModify[toModifyStart - 1] !== '\n' && toModifyStart - 1 > 0) {
      // linebreak necessary b/c adding text past endline
      conditionalLinebreak = '\n';
    }
    return (
      textToModify.substring(0, toModifyStart) +
      conditionalLinebreak +
      textToCopy.substring(toCopyStart, toCopyEnd + 1)
    );
  }
}
