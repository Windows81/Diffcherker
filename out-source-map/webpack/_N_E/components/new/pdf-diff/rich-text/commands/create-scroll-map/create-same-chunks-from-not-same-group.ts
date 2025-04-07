import { RichTextDiffChunk } from 'types/rich-text';
import { NotSameGroup } from '.';

export default function createSameChunksFromNotSameGroup(
  notSameGroup: NotSameGroup,
  sameChunks: RichTextDiffChunk[],
  startIndex: number = 0,
) {
  return sameChunks.slice(startIndex, notSameGroup.afterSame + 1);
}
