import { RichTextDiffChunk } from 'types/rich-text';
import { NotSameGroup } from '.';

export default function createNotSameChunksFromNotSameGroup(
  notSameGroup: NotSameGroup,
  chunks: RichTextDiffChunk[],
) {
  return chunks.slice(notSameGroup.start, notSameGroup.end + 1);
}
