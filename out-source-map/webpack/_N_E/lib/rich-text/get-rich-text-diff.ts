import { Chunk, ChunkType, DiffLevel, Meta as Row } from 'types/normalize';
import { PDFiumChunk } from 'lib/pdfium/messages';
import {
  RichTextDiffChunk,
  RichTextContentDiffChunk,
  RowChunk,
} from 'types/rich-text';
import getChangeLog from './get-change-log';
import { MovedTo, Moves } from 'types/moves';
import normalize from 'lib/normalize';

const getRichTextDiff = (
  rows: Row[],
  leftData: PDFiumChunk[][],
  rightData: PDFiumChunk[][],
  diffLevel: DiffLevel,
  moves?: Moves,
) => {
  if (moves?.deletionToInsertionMap) {
    convertChunksForMoves(rows, moves.deletionToInsertionMap, diffLevel);
  }

  const rowChunks = rows.reduce(
    (acc, row) => {
      if (row.left.chunks.length) {
        acc.left.push(...row.left.chunks);
      }
      if (row.right.chunks.length) {
        acc.right.push(...row.right.chunks);
      }
      return acc;
    },
    { left: [] as RowChunk[], right: [] as RowChunk[] },
  );

  const left: RichTextDiffChunk[] = flatMapPDFiumChunks(leftData);
  const right: RichTextDiffChunk[] = flatMapPDFiumChunks(rightData);

  combineChunks(left, rowChunks.left);
  combineChunks(right, rowChunks.right);

  matchUpChunks(left, right);

  return { left, right, changeLog: getChangeLog(left, right) };
};

const matchUpChunks = (
  left: RichTextDiffChunk[],
  right: RichTextDiffChunk[],
) => {
  let leftIndex = 0;
  let rightIndex = 0;
  let id = 0;

  const leftIDMap = new Map<number, number>();
  const rightIDMap = new Map<number, number>();

  while (leftIndex < left.length || rightIndex < right.length) {
    const leftChunk: RichTextDiffChunk | undefined = left[leftIndex];
    const rightChunk: RichTextDiffChunk | undefined = right[rightIndex];

    if (
      leftChunk &&
      rightChunk &&
      leftChunk.type === 'equal' &&
      rightChunk.type === 'equal'
    ) {
      // Both sides are equal, so we can match them up.
      const numCharsLeft = countCharsInChunk(leftChunk);
      const numCharsRight = countCharsInChunk(rightChunk);

      if (numCharsLeft < numCharsRight) {
        // Left chunk has less chars than right chunk, split off right.
        splitChunk(right, rightIndex, numCharsLeft);
      } else if (numCharsRight < numCharsLeft) {
        // Right chunk has less chars than left chunk, split off left.
        splitChunk(left, leftIndex, numCharsRight);
      }

      const fontFamilyChanged = leftChunk.fontFamily !== rightChunk.fontFamily;
      const fontSizeChanged = leftChunk.fontSize !== rightChunk.fontSize;
      const colorChanged = leftChunk.color !== rightChunk.color;

      leftChunk.id = id;
      leftChunk.fontFamilyChanged = fontFamilyChanged;
      leftChunk.fontSizeChanged = fontSizeChanged;
      leftChunk.colorChanged = colorChanged;
      rightChunk.id = id;
      rightChunk.fontFamilyChanged = fontFamilyChanged;
      rightChunk.fontSizeChanged = fontSizeChanged;
      rightChunk.colorChanged = colorChanged;
      id++;
      leftIndex++;
      rightIndex++;
    } else if (leftChunk && leftChunk.type === 'move') {
      if (
        leftIDMap.has(leftChunk.moveId) &&
        left[leftIndex - 1].type === 'move' &&
        leftIDMap.get(leftChunk.moveId) === left[leftIndex - 1].id
      ) {
        // Chunk split up due to style differences. BANDAID COMBINE.
        // The reason that an entirely new chunk is created is to avoid
        // mutating the original PDFiumChunks.
        const newChunk = {
          ...left[leftIndex - 1],
          text: [...left[leftIndex - 1].text, ...leftChunk.text],
          y: [...left[leftIndex - 1].y, ...leftChunk.y],
          x: [...left[leftIndex - 1].x, ...leftChunk.x],
        };
        left.splice(leftIndex - 1, 2, newChunk);
        continue;
      }
      if (rightIDMap.has(leftChunk.moveId)) {
        // RIGHT ID HAS PREVIOUSLY BEEN DISCOVERED
        leftChunk.id = rightIDMap.get(leftChunk.moveId)!;
      } else {
        // RIGHT ID HAS NOT BEEN DISCOVERED, LEFT IS THE FIRST PART OF A MOVE
        leftChunk.id = id;
        leftIDMap.set(leftChunk.moveId, id);
        id++;
      }
      leftIndex++;
    } else if (rightChunk && rightChunk.type === 'move') {
      if (
        rightIDMap.has(rightChunk.moveId) &&
        right[rightIndex - 1].type === 'move' &&
        rightIDMap.get(rightChunk.moveId) === right[rightIndex - 1].id
      ) {
        const newChunk = {
          ...right[rightIndex - 1],
          text: [...right[rightIndex - 1].text, ...rightChunk.text],
          y: [...right[rightIndex - 1].y, ...rightChunk.y],
          x: [...right[rightIndex - 1].x, ...rightChunk.x],
        };
        right.splice(rightIndex - 1, 2, newChunk);
        continue;
      }
      if (leftIDMap.has(rightChunk.moveId)) {
        // LEFT ID HAS PREVIOUSLY BEEN DISCOVERED
        rightChunk.id = leftIDMap.get(rightChunk.moveId)!;
      } else {
        // LEFT ID HAS NOT BEEN DISCOVERED, RIGHT IS THE FIRST PART OF A MOVE
        rightChunk.id = id;
        rightIDMap.set(rightChunk.moveId, id);
        id++;
      }
      rightIndex++;
    } else if (leftChunk && leftChunk.type !== 'equal') {
      // Left chunk is not equal, so we can't match it up.
      leftChunk.id = id;
      id++;
      leftIndex++;
    } else if (rightChunk && rightChunk.type !== 'equal') {
      // Right chunk is not equal, so we can't match it up.
      rightChunk.id = id;
      id++;
      rightIndex++;
    } else if (!leftChunk && !rightChunk) {
      // Break out of loop if we've reached the end of both sides.
      // This should never happen but is here as a safety net.
      break;
    }
  }
};

const combineChunks = (
  richChunks: RichTextDiffChunk[],
  diffChunks: RowChunk[],
) => {
  let chunkIndex = 0;

  let lastChunkType;
  let lastMoveId;
  let numCharsTilDiffSplit = 0;

  for (const diffChunk of diffChunks) {
    if (diffChunk.type === 'empty' || diffChunk.value === '') {
      // We don't need to do anything since it's empty.
      continue;
    }

    if (!lastChunkType) {
      // This is the first iteration, set up.
      lastChunkType = diffChunk.type;
      if (diffChunk.type === 'move') {
        lastMoveId = diffChunk.moveId;
      }
      numCharsTilDiffSplit += diffChunk.value.length;
      continue;
    }

    if (diffChunk.type === lastChunkType && diffChunk.type !== 'move') {
      // Same chunk type as before, keep going.
      numCharsTilDiffSplit += diffChunk.value.length;
      continue;
    }

    // Now we need to split chunks, as chunk type has changed.
    while (numCharsTilDiffSplit > 0) {
      const rtChunk = richChunks[chunkIndex];
      rtChunk.type = lastChunkType;
      if (rtChunk.type === 'move') {
        rtChunk.moveId = lastMoveId!;
      }
      const numCharsInRTChunk = countCharsInChunk(rtChunk);

      if (numCharsInRTChunk < numCharsTilDiffSplit) {
        // Chunk has less chars than we need, keep going. Unless its a move, because move chunks can follow each other but have different ids.
        numCharsTilDiffSplit -= numCharsInRTChunk;
      } else if (numCharsInRTChunk === numCharsTilDiffSplit) {
        // Chunks line up perfectly, already split.
        numCharsTilDiffSplit = 0;
      } else {
        // Chunk has more chars than we need, must split the current chunk.
        splitChunk(richChunks, chunkIndex, numCharsTilDiffSplit);
        numCharsTilDiffSplit = 0;
      }

      chunkIndex++;
    }

    lastChunkType = diffChunk.type;
    lastMoveId = diffChunk.type === 'move' ? diffChunk.moveId : undefined;
    numCharsTilDiffSplit += diffChunk.value.length;
  }

  if (chunkIndex < richChunks.length && lastChunkType) {
    // There are no more rows, but the last chunks haven't been processed and given a type yet.
    for (let i = chunkIndex; i < richChunks.length; i++) {
      const chunk = richChunks[i];
      chunk.type = lastChunkType;
      if (chunk.type === 'move') {
        chunk.moveId = lastMoveId!;
      }
    }
  }
};

const flatMapPDFiumChunks = (chunks: PDFiumChunk[][]): RichTextDiffChunk[] => {
  return chunks.flatMap((pageChunks, pageIndex) =>
    pageChunks.map((chunk) => ({
      ...chunk,
      pageIndex,
      type: '[UNSET]' as RichTextContentDiffChunk['type'], // Will be set later, done this way for debugging purposes.
      id: -1,
    })),
  );
};

const countCharsInChunk = (chunk: PDFiumChunk) => {
  return chunk.text.reduce((acc, str) => acc + str.length, 0);
};

const splitChunk = (
  chunks: PDFiumChunk[],
  chunkIndex: number,
  numCharsToSplit: number,
) => {
  if (numCharsToSplit === 0) {
    return;
  }

  const currChunk = chunks[chunkIndex];
  const newChunk = { ...currChunk };

  let lineIndex = 0;
  let charIndex = 0;

  let numCharsLeft = numCharsToSplit;

  while (numCharsLeft > 0) {
    const currLine = currChunk.text[lineIndex];
    if (currLine.length <= numCharsLeft) {
      numCharsLeft -= currLine.length;
      lineIndex++;
    } else {
      charIndex = numCharsLeft;
      numCharsLeft = 0;
    }
  }

  if (charIndex === 0) {
    currChunk.text = currChunk.text.slice(0, lineIndex);
    currChunk.y = currChunk.y.slice(0, lineIndex);
    currChunk.x = currChunk.x.slice(0, lineIndex);

    newChunk.text = newChunk.text.slice(lineIndex);
    newChunk.y = newChunk.y.slice(lineIndex);
    newChunk.x = newChunk.x.slice(lineIndex);
  } else {
    currChunk.text = currChunk.text.slice(0, lineIndex + 1);
    currChunk.text[lineIndex] = currChunk.text[lineIndex].slice(0, charIndex);
    currChunk.y = currChunk.y.slice(0, lineIndex + 1);
    currChunk.x = currChunk.x.slice(0, lineIndex + 1);
    currChunk.x[lineIndex] = currChunk.x[lineIndex].slice(0, charIndex);

    newChunk.text = newChunk.text.slice(lineIndex);
    newChunk.text[0] = newChunk.text[0].slice(charIndex);
    newChunk.y = newChunk.y.slice(lineIndex);
    newChunk.x = newChunk.x.slice(lineIndex);
    newChunk.x[0] = newChunk.x[0].slice(charIndex);
  }

  chunks.splice(chunkIndex + 1, 0, newChunk);
};

/**
 * Takes move data and directly modifies the chunks inside rows to reflect the moves.
 */
const convertChunksForMoves = (
  rows: Row[],
  deletionToInsertionMap: MovedTo[],
  diffLevel: DiffLevel,
) => {
  // generate line number to row index map
  const leftLineToRowIndex: number[] = [0];
  const rightLineToRowIndex: number[] = [0];

  for (let i = 0; i < rows.length; i++) {
    if (rows[i].left.chunks.length > 0) {
      leftLineToRowIndex.push(i);
    }
    if (rows[i].right.chunks.length > 0) {
      rightLineToRowIndex.push(i);
    }
  }

  const moveIdTracker = { id: 0 };
  deletionToInsertionMap.forEach((movedTo: MovedTo, movedFromStart: number) => {
    // get text from row for movedfrom and movedto
    const movedFromText = rows
      .slice(
        leftLineToRowIndex[movedFromStart],
        leftLineToRowIndex[movedTo.movedFromEndExclusive - 1] + 1,
      )
      .filter((row) => row.left.chunks.length > 0)
      .map((row) => row.left.chunks.map((chunk) => chunk.value).join(''))
      .join('\n');
    const movedToText = rows
      .slice(
        rightLineToRowIndex[movedTo.movedToStart],
        rightLineToRowIndex[movedTo.movedToEndExclusive - 1] + 1,
      )
      .filter((row) => row.right.chunks.length > 0)
      .map((row) => row.right.chunks.map((chunk) => chunk.value).join(''))
      .join('\n');

    const moveDiff = normalize(movedFromText, movedToText, diffLevel, {
      computeMoves: false,
    });

    const leftNumLines = movedTo.movedFromEndExclusive - movedFromStart;
    const rightNumLines = movedTo.movedToEndExclusive - movedTo.movedToStart;

    if (leftNumLines !== rightNumLines) {
      return;
    }

    let leftSkips = 0;
    let rightSkips = 0;

    // This for loop along with the addInMoveChunks is responsible for editing the
    // pre-existing diff chunks to include move information, through a series of splits and merges.
    // the algorithm does not have the best quality of outcome as it immediately discards moves
    // when alignment issues arise instead of trying to resolve them. TODO: improve this in the future, if necessary.
    for (let i = 0; i < leftNumLines; i++) {
      const moveIdTrackerRight = { id: moveIdTracker.id }; // duped for right side.
      const leftRowIndex = leftLineToRowIndex[movedFromStart + i];
      const rightRowIndex = rightLineToRowIndex[movedTo.movedToStart + i];
      if (leftRowIndex === rightRowIndex) {
        continue; // move on the same row is just a change block.
        // Do not need to do anything here.
      }
      while (moveDiff.rows[i + leftSkips].left.chunks.length === 0) {
        leftSkips++;
      }
      const tempLeftChunks = addInMoveChunks(
        rows[leftRowIndex].left.chunks,
        moveDiff.rows[i + leftSkips].left.chunks,
        'remove',
        moveIdTracker,
      );
      while (moveDiff.rows[i + rightSkips].right.chunks.length === 0) {
        rightSkips++;
      }
      const tempRightChunks = addInMoveChunks(
        rows[rightRowIndex].right.chunks,
        moveDiff.rows[i + rightSkips].right.chunks,
        'insert',
        moveIdTrackerRight,
      );
      // if the moveIdTracker id is different, then the moves don't actually line up, do not add this set of moves.
      if (moveIdTracker.id !== moveIdTrackerRight.id) {
        continue;
      }
      rows[leftRowIndex].left.chunks = tempLeftChunks;
      rows[rightRowIndex].right.chunks = tempRightChunks;
    }
  });
};

/**
 * A function to merge move diff chunks with the original diff chunks.
 * This is done by iterating through the original chunks, and adding it
 * as it is if its a 'equal' chunk, and adding the move chunks if its a 'move' chunk.
 */
const addInMoveChunks = (
  originalChunks: Chunk[],
  moveChunks: Chunk[],
  type: 'remove' | 'insert',
  moveIdTracker: { id: number },
): Chunk[] => {
  const resultingChunks: Chunk[] = [];
  let moveChunkIndex = 0;
  let moveChunkCharIndex = 0;
  let moveCount = 0;
  for (const originalChunk of originalChunks) {
    if (originalChunk.type === 'equal') {
      resultingChunks.push(originalChunk);
      moveChunkCharIndex += originalChunk.value.length;
      while (
        moveChunks[moveChunkIndex] &&
        moveChunkCharIndex >= moveChunks[moveChunkIndex].value.length
      ) {
        moveChunkCharIndex -= moveChunks[moveChunkIndex].value.length;
        moveChunkIndex++;
      }
      continue;
    }
    // else
    let charRemaining = originalChunk.value.length;
    while (charRemaining > 0) {
      const moveChunk = moveChunks[moveChunkIndex];
      const moveChunkSliced = moveChunk.value.slice(
        moveChunkCharIndex,
        moveChunkCharIndex + charRemaining,
      );
      if (moveChunkSliced.length > 0) {
        moveChunk.type === 'equal' && (moveCount += moveChunkSliced.length);
        resultingChunks.push({
          value: moveChunkSliced,
          type: (moveChunk.type === 'equal' ? 'move' : `${type}`) as ChunkType, // 'move' is a special type for moves
          moveId: moveChunk.type === 'equal' ? moveIdTracker.id++ : undefined,
          // This is forced coercion to Chunk, as we are mutating the diff rows,
          // and this is easier to do than to change up Chunk heavily to be adaptable for this.
          // Plus when the rows are flattend into RowChunks, the RowChunk type ends up having a possible 'type' of 'move' with 'moveId'.
        } as Chunk);
      }
      charRemaining -= moveChunkSliced.length;
      if (
        moveChunkSliced.length <
        moveChunk.value.length - moveChunkCharIndex
      ) {
        moveChunkCharIndex += moveChunkSliced.length;
      } else {
        moveChunkCharIndex = 0;
        moveChunkIndex++;
      }
    }
  }
  if (moveCount < 8) {
    return originalChunks;
  }
  return resultingChunks;
};

export default getRichTextDiff;
