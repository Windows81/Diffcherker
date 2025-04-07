import { Diff } from 'types/diff';

import { DiffBlock, UnifiedRow, Meta as Row } from 'types/normalize';

export default function makeUnified(diff: Diff): Diff {
  if (!diff.rows || !diff.blocks) {
    return diff;
  }
  const { rows, blocks } = diff;

  const newBlocks: DiffBlock[] = [];
  const newRows: UnifiedRow[] = [];

  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].type.left === 'remove' || blocks[i].type.right === 'insert') {
      const newBlockStart = newRows.length;
      addUnifiedChangeRows(
        rows,
        newRows,
        blocks[i].lineStart,
        blocks[i].lineEnd,
      );
      const newBlockEnd = newRows.length - 1;
      newBlocks.push({
        ...blocks[i],
        lineStart: newBlockStart,
        lineEnd: newBlockEnd,
      });
    } else {
      addUnifiedSimpleRows(
        rows,
        newRows,
        blocks[i].lineStart,
        blocks[i].lineEnd,
      );
      newBlocks.push({
        ...blocks[i],
        lineStart: newRows.length - blocks[i].lineEnd + blocks[i].lineStart - 1,
        lineEnd: newRows.length - 1,
      });
    }
  }

  return {
    ...diff,
    rows: newRows,
    blocks: newBlocks,
  };
}

function addUnifiedSimpleRows(
  rows: Row[],
  newRows: UnifiedRow[],
  lineStart: number,
  lineEnd: number,
) {
  for (let n = lineStart; n <= lineEnd; n++) {
    newRows.push({
      ...rows[n],
      originalIndex: n,
      blockStart: false,
      blockEnd: false,
    });
  }
  newRows[newRows.length - lineEnd + lineStart - 1].blockStart = true;
  newRows[newRows.length - 1].blockEnd = true;
}

function addUnifiedChangeRows(
  rows: Row[],
  newRows: UnifiedRow[],
  lineStart: number,
  lineEnd: number,
) {
  const firstIndex = newRows.length;
  for (let n = lineStart; n <= lineEnd; n++) {
    // Probably faster than making two separate arrays and the concatenating them.
    if (rows[n].left.chunks.length > 0) {
      newRows.push({
        ...rows[n],
        right: { chunks: [], line: 0 },
        originalIndex: n,
        blockStart: false,
        blockEnd: false,
      });
    } else {
      break;
    }
  }
  for (let n = lineStart; n <= lineEnd; n++) {
    if (rows[n].right.chunks.length > 0) {
      newRows.push({
        ...rows[n],
        left: { chunks: [], line: 0 },
        originalIndex: n,
        blockStart: false,
        blockEnd: false,
      });
    } else {
      break;
    }
  }
  const lastIndex = newRows.length - 1;
  newRows[firstIndex].blockStart = true;
  newRows[lastIndex].blockEnd = true;
}
