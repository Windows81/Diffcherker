import { RichTextDiffChunk } from 'types/rich-text';
import { NotSameGroup } from '.';
import { DiffSide } from 'types/diffSide';

export type NotSameGroupByOptions = {
  content?: boolean;
  fontFamily?: boolean;
  fontSize?: boolean;
  color?: boolean;
};

export function isChunkNotSame(
  chunk: RichTextDiffChunk,
  groupByOptions: NotSameGroupByOptions,
) {
  if (groupByOptions.content && chunk.type !== 'equal') {
    return true;
  }

  if (chunk.type === 'equal') {
    return (
      (groupByOptions.color && chunk.colorChanged) ||
      (groupByOptions.fontFamily && chunk.fontFamilyChanged) ||
      (groupByOptions.fontSize && chunk.fontSizeChanged)
    );
  }

  return false;
}

function groupNotSameSide(
  chunks: RichTextDiffChunk[],
  notSameGroups: NotSameGroup[],
  side: DiffSide,
) {
  let inNotSame = false;
  let notSameEnd = chunks.length - 1;

  for (let i = chunks.length - 1; i >= 0; i--) {
    if (chunks[i].type !== 'equal') {
      if (!inNotSame) {
        notSameEnd = i;
        inNotSame = true;
      }

      if (i === 0) {
        notSameGroups.unshift({
          afterSame: -1,
          start: i,
          end: notSameEnd,
          side,
        });
      }
    } else {
      if (inNotSame) {
        notSameGroups.unshift({
          afterSame: chunks.indexOf(chunks[i]),
          start: i + 1,
          end: notSameEnd,
          side,
        });
        inNotSame = false;
      }
    }
  }
}

export default function groupNotSameChunksToArray(
  leftChunks: RichTextDiffChunk[],
  rightChunks: RichTextDiffChunk[],
): NotSameGroup[] {
  const notSameGroups: NotSameGroup[] = [];

  groupNotSameSide(leftChunks, notSameGroups, 'left');
  groupNotSameSide(rightChunks, notSameGroups, 'right');

  return notSameGroups;
}
