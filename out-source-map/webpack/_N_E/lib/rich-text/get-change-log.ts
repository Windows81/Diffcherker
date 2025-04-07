import { RichTextDiffChunk, RichTextChangeItem } from 'types/rich-text';

const getChangeLog = (
  left: RichTextDiffChunk[],
  right: RichTextDiffChunk[],
): RichTextChangeItem[] => {
  if (left.length === 0 && right.length === 0) {
    return [];
  }

  const changeLogs: RichTextChangeItem[] = [];
  // saving the first part of the move so that the second part can access it later.
  const moveMap = new Map<number, number>();

  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left.length || rightIndex < right.length) {
    const leftChunk: RichTextDiffChunk | undefined = left[leftIndex];
    const rightChunk: RichTextDiffChunk | undefined = right[rightIndex];

    if (
      leftChunk &&
      rightChunk &&
      leftChunk.type === 'equal' &&
      rightChunk.type === 'equal'
    ) {
      // Both sides are equal, so we need to check style changes.

      if (
        leftChunk.fontFamilyChanged ||
        leftChunk.fontSizeChanged ||
        leftChunk.colorChanged
      ) {
        // We only need to check one chunk since we've already
        // calculated the style changes on both sides when diffing.
        // They should be the same on both sides.
        changeLogs.push({
          chunkId: leftChunk.id,
          text: leftChunk.text.flat().join(''),
          type: 'style',
          chunkBefore: leftChunk,
          chunkAfter: rightChunk,
        });
      }

      leftIndex++;
      rightIndex++;
    } else if (leftChunk && leftChunk.type === 'move') {
      if (moveMap.has(leftChunk.moveId)) {
        // If the move chunk is the second part of the move,
        // we add the move logs to the change logs.
        const moveToPageIndex = moveMap.get(leftChunk.moveId)!;
        changeLogs.push({
          chunkId: leftChunk.id,
          text: leftChunk.text.flat().join(''),
          type: 'move',
          movedFromPage: leftChunk.pageIndex + 1,
          movedToPage: moveToPageIndex,
        });
      } else {
        moveMap.set(leftChunk.moveId, leftChunk.pageIndex + 1);
      }
      leftIndex++;
    } else if (rightChunk && rightChunk.type === 'move') {
      if (moveMap.has(rightChunk.moveId)) {
        // If the move chunk is the second part of the move,
        // we add the move logs to the change logs.
        const moveFromPageIndex = moveMap.get(rightChunk.moveId)!;
        changeLogs.push({
          chunkId: rightChunk.id,
          text: rightChunk.text.flat().join(''),
          type: 'move',
          movedFromPage: moveFromPageIndex,
          movedToPage: rightChunk.pageIndex + 1,
        });
      } else {
        moveMap.set(rightChunk.moveId, rightChunk.pageIndex + 1);
      }
      rightIndex++;
    } else if (leftChunk && leftChunk.type !== 'equal') {
      // Left chunk is not equal, so we add it to the change logs.
      changeLogs.push({
        chunkId: leftChunk.id,
        text: leftChunk.text.flat().join(''),
        type: leftChunk.type,
      });

      leftIndex++;
    } else if (rightChunk && rightChunk.type !== 'equal') {
      // Right chunk is not equal, so we add it to the change logs.
      changeLogs.push({
        chunkId: rightChunk.id,
        text: rightChunk.text.flat().join(''),
        type: rightChunk.type,
      });

      rightIndex++;
    } else if (!leftChunk && !rightChunk) {
      // Break out of loop if we've reached the end of both sides.
      // This should never happen but is here as a safety net.
      break;
    }
  }

  return changeLogs;
};

export default getChangeLog;
