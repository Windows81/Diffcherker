import { DiffBlock } from 'types/normalize';
import { Diff } from 'types/diff';
import { type Meta as Row } from 'types/normalize';
import findCharIndexFromRow from './find-char-index-from-row';

export default function modifyDiffText(
  diff: Diff,
  diffBlocks: DiffBlock[],
  startRow: number,
  endRow: number,
  rows: Row[],
  toModify: 'right' | 'left',
): string {
  const toCopy = toModify === 'left' ? 'right' : 'left';
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
  const toCopyEndpoints = findCharIndexFromRow(
    diff,
    diffBlocks,
    startRow,
    endRow,
    rows,
    toCopy,
  );
  const { startChar: toCopyStart } = toCopyEndpoints;
  let { endChar: toCopyEnd } = toCopyEndpoints;
  const textToModify = diff[toModify] as string;
  const textToCopy = diff[toCopy] as string;
  if (
    !textToModify.includes('\n', toModifyEnd - 1) && // this first check is to ensure modified fragment extends to last line
    textToCopy[toCopyEnd] === '\n'
  ) {
    // here we need to remove the linebreak after text b/c it doesn't exist on other side
    toCopyEnd--;
  }
  if (textToModify.length > toModifyEnd) {
    let conditionalLinebreak = '';
    if (
      !textToCopy.includes('\n', toCopyEnd - 1) && // this first check is to ensure copied fragment extends to last line
      textToCopy[toCopyEnd] !== '\n' &&
      textToModify[toModifyEnd] === '\n'
    ) {
      // add back line break at end of modified section if removed
      conditionalLinebreak = '\n';
    }
    return (
      textToModify.substring(0, toModifyStart) +
      textToCopy.substring(toCopyStart, toCopyEnd + 1) +
      conditionalLinebreak +
      textToModify.substring(toModifyEnd + 1)
    );
  } else {
    if (
      !textToCopy.includes('\n', toCopyEnd) && // make sure copied fragment is beyond last line
      textToModify[toModifyStart - 1] === '\n' &&
      textToCopy.length <= toModifyStart &&
      textToCopy[toCopyStart - 1] !== '\n'
    ) {
      // here we need to remove the linebreak before the text if it exists b/c there is linebreak after
      toModifyStart--;
    }
    let conditionalLinebreak = '';
    if (
      textToModify.length <= toModifyStart &&
      textToModify.length - 1 > 0 &&
      textToModify[textToModify.length - 1] !== '\n'
    ) {
      // here we need to add a linebreak from the last line because we are going beyond it
      conditionalLinebreak = '\n';
    }
    return (
      textToModify.substring(0, toModifyStart) +
      conditionalLinebreak +
      textToCopy.substring(toCopyStart, toCopyEnd + 1)
    );
  }
}
