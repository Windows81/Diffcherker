import { DiffBlock } from 'types/normalize';
import { Diff } from 'types/diff';
import { type Meta as Row } from 'types/normalize';
import findCharIndexFromRow from './find-char-index-from-row';

export default function deleteDiffText(
  diff: Diff,
  diffBlocks: DiffBlock[],
  startRow: number,
  endRow: number,
  rows: Row[],
  toModify: 'right' | 'left',
): string {
  const toModifyEndpoints = findCharIndexFromRow(
    diff,
    diffBlocks,
    startRow,
    endRow,
    rows,
    toModify,
  );
  let { startChar: toModifyStart } = toModifyEndpoints;
  const { endChar: toModifyEnd } = toModifyEndpoints;
  const textToModify = diff[toModify] as string;
  if (textToModify.length > toModifyEnd) {
    return (
      textToModify.substring(0, toModifyStart) +
      textToModify.substring(toModifyEnd + 1)
    );
  } else {
    if (textToModify[toModifyStart - 1] === '\n') {
      // here we need to remove the linebreak before the text if it exists b/c there is linebreak after
      toModifyStart--;
    }
    return textToModify.substring(0, toModifyStart);
  }
}
