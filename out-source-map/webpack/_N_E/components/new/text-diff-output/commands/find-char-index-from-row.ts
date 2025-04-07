import { DiffBlock } from 'types/normalize';
import { Diff } from 'types/diff';
import { type Meta as Row } from 'types/normalize';

export default function findCharIndexFromRow(
  diff: Diff,
  diffBlocks: DiffBlock[],
  startRow: number,
  endRow: number,
  rows: Row[],
  column: 'right' | 'left',
): { startChar: number; endChar: number } {
  let linebreaksBeforeStart: number;
  if (
    rows[startRow][column].line !== undefined &&
    rows[startRow][column].line !== 0
  ) {
    linebreaksBeforeStart = rows[startRow][column].line - 1;
  } else if (
    startRow - 1 >= 0 &&
    rows[startRow - 1][column].line !== undefined
  ) {
    // @ts-expect-error: line is not undefined, see check above
    linebreaksBeforeStart = rows[startRow - 1][column].line;
  } else {
    linebreaksBeforeStart = 0;
  }
  let linebreaksBeforeEnd: number;
  if (
    rows[endRow][column].line !== undefined &&
    rows[endRow][column].line !== 0
  ) {
    linebreaksBeforeEnd = rows[endRow][column].line - 1;
  } else if (
    endRow + 1 <= rows.length - 1 &&
    rows[endRow + 1][column].line !== undefined &&
    rows[endRow + 1][column].line !== 0
  ) {
    // @ts-expect-error: line is not undefined, see check above
    linebreaksBeforeEnd = rows[endRow + 1][column].line - 1;
  } else {
    linebreaksBeforeEnd = rows.length - 1;
  }
  // the below loop is to compensate for the case where an empty row that corresponds
  // to a modification on the other side has a '\n' linebreak in the textual representation.
  // if not for this, we would assume that there is no '\n' there and not look far enough
  // into the text
  let blockStartRow =
    diffBlocks[0] !== undefined ? diffBlocks[0].lineStart : startRow;
  for (let i = 0; blockStartRow < startRow; i++) {
    const rowOfBlock = rows[diffBlocks[i].lineStart];
    const aboveLineInsideChanged =
      diffBlocks[i].lineStart > 0 &&
      rows[diffBlocks[i].lineStart - 1].insideChanged;
    if (
      rowOfBlock[column].chunks.length === 0 &&
      rowOfBlock.insideChanged &&
      !aboveLineInsideChanged
    ) {
      linebreaksBeforeStart++;
      linebreaksBeforeEnd++;
    }
    blockStartRow =
      diffBlocks[i + 1] !== undefined ? diffBlocks[i + 1].lineStart : startRow;
  }
  let startChar = 0;
  let endChar = 0;
  let beyondLastLine = false;
  for (let lineNumber = 0; lineNumber < linebreaksBeforeStart; lineNumber++) {
    const linebreakIndex = (diff[column] as string).indexOf('\n', startChar);
    if (linebreakIndex === -1) {
      beyondLastLine = true;
    }
    startChar = linebreakIndex + 1; // account for length of '/n' (it's considered 1 character)
  }
  if (beyondLastLine) {
    // this means a modification after the last line of the other side
    startChar = (diff[column] as string).length;
    endChar = startChar;
    return { startChar, endChar };
  }
  endChar = startChar;
  for (
    let lineNumber = linebreaksBeforeStart;
    lineNumber < linebreaksBeforeEnd;
    lineNumber++
  ) {
    const linebreakIndex = (diff[column] as string).indexOf('\n', endChar);
    endChar = linebreakIndex + 1;
  }
  let charactersOnEndLine = 0;
  for (const chunk of rows[endRow][column].chunks) {
    charactersOnEndLine += chunk.value.length;
  }
  endChar += charactersOnEndLine;
  return { startChar, endChar };
}
