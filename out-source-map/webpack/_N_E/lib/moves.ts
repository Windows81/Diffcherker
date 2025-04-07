import { EnhancedDmpDiff, Lines } from 'types/normalize';
import { DiffOperation, DmpDiff } from './diff/types';
import { MoveRangeList, NonOverlappingRangeTree } from './range-tree';
import { MovedTo, Moves } from 'types/moves';

// CODE MOVES Configuation constants:

// How similar two code blocks need to be to be considered a move, 0.9 means 90% similarity.
const CODE_MOVES_SIMILARITY_THRESHOLD = 0.9; // OVERRIDABLE
// How many lines can be between two moves before it is no longer considered a move.
const CODE_MOVES_MAX_LINE_COUNT_BETWEEN_MOVES = 1000;
// If either of the strings are longer than this, use a simple comparison instead of a histogram.
const CODE_MOVES_SIMPLE_COMPARISON_CHAR_THRESHOLD = 1000;
// If either the amount of simple insertions / deletions are more than this, use a simple comparison instead of a histogram.
// Simple insertion / deletions are either remove-empty or empty-insert.
const CODE_MOVES_SIMPLE_COMPARISON_DIFF_THRESHOLD = 500;
// Minimum number of lines in a block for it to be considered for moves.
const CODE_MOVES_MIN_NUMBER_OF_LINES = 3; // OVERRIDABLE
// How similar lines need to be for advanced moves to extend their partial matches.
// The reason this is lower than CODE_MOVES_SIMILARITY_THRESHOLD is because we are extending the move, so
// we already have 3 lines that are completely the same, and this is only to extend that.
const CODE_MOVES_PARTIAL_MATCH_THRESHOLD = 0.6;
// How many characters is needed before the extension part of advancedMoves starts using direct string equality.
const CODE_MOVES_LINE_EXTENSION_CHAR_THRESHOLD = 200;

type ComputeMoveOptions = {
  // Usually advanced moves needs one line to be exactly the same,
  // this allows for fully partial matches to be considered in advanced moves.
  fullyPartialMatches?: boolean;
  // minimum line length for it to be considered for moves.
  minLineLength?: number;
  // extend the advanced moves to include partial matches.
  extendMovesInAdvanced?: boolean;
  // use only simple moves, no advanced moves are calculated.
  simpleMovesOnly?: boolean;
  // CODE_MOVES_SIMILARITY_THRESHOLD is overriden by this.
  simpleMoveSimilarityThreshold?: number;
  // CODE_MOVES_MIN_NUMBER_OF_LINES is overriden by this.
  minLines?: number;
};

export function computeMoves(diffs: DmpDiff[], options: ComputeMoveOptions) {
  const movesTimeout = {
    amount: 5,
    start: Date.now(),
  };

  // should i extend this to the rest of the stuff? keep in mind for later.
  const enhancedDiffs = enhance(diffs);

  // manual for-loop filtering because its faster to filter once for both than to filter twice.
  const deletions: EnhancedDmpDiff[] = [];
  const insertions: EnhancedDmpDiff[] = [];
  const simpleIgnoredDeletionLines = new Set<number>();
  const simpleIgnoredInsertionLines = new Set<number>();

  for (let i = 0; i < enhancedDiffs.length; i++) {
    if (
      enhancedDiffs[i].lineEndExclusive - enhancedDiffs[i].lineStart <
        (options.minLines ?? CODE_MOVES_MIN_NUMBER_OF_LINES) ||
      enhancedDiffs[i].operation === DiffOperation.EQUAL
    ) {
      continue;
    }
    if (enhancedDiffs[i].operation === DiffOperation.DELETE) {
      deletions.push(enhancedDiffs[i]);
      if (
        enhancedDiffs[i + 1] &&
        enhancedDiffs[i + 1].operation === DiffOperation.INSERT
      ) {
        simpleIgnoredDeletionLines.add(deletions.length - 1);
      }
    } else if (enhancedDiffs[i].operation === DiffOperation.INSERT) {
      insertions.push(enhancedDiffs[i]);
      if (
        enhancedDiffs[i - 1] &&
        enhancedDiffs[i - 1].operation === DiffOperation.DELETE
      ) {
        simpleIgnoredInsertionLines.add(insertions.length - 1);
      }
    }
  }

  // simpleMoves is a object of two maps, deletionToInsertionMap and insertionToDeletionMap.
  // TODO: add information potentially about length of self-side if we ever want to do styling like a box around the move.
  const simpleMoves = computeSimpleMoves(
    deletions,
    insertions,
    simpleIgnoredDeletionLines,
    simpleIgnoredInsertionLines,
    movesTimeout,
    options,
  );

  // if the simpleMoves take too much time, return early.
  if (!timeoutIsValid(movesTimeout)) {
    return simpleMoves;
  }

  if (options.simpleMovesOnly) {
    return simpleMoves;
  }

  const simpleAndAdvancedMoves = computeAdvancedMoves(
    deletions,
    insertions,
    movesTimeout,
    simpleMoves,
    options,
  );

  return simpleAndAdvancedMoves;
}

export function enhance(diffs: DmpDiff[]) {
  let leftLineCount = 1;
  let rightLineCount = 1;
  const enhancedDiffs: EnhancedDmpDiff[] = [];
  for (let i = 0; i < diffs.length; i++) {
    const diff = diffs[i];
    if (diff[0] === DiffOperation.DELETE) {
      const oldLeftLineCount = leftLineCount;
      leftLineCount += countLines(diff[1]);
      enhancedDiffs.push({
        operation: diff[0],
        text: diff[1],
        lineStart: oldLeftLineCount,
        lineEndExclusive: leftLineCount,
      });
    } else if (diff[0] === DiffOperation.INSERT) {
      const oldRightLineCount = rightLineCount;
      rightLineCount += countLines(diff[1]);
      enhancedDiffs.push({
        operation: diff[0],
        text: diff[1],
        lineStart: oldRightLineCount,
        lineEndExclusive: rightLineCount,
      });
    } else {
      // pushing equal diffs just to keep track of change blocks.
      enhancedDiffs.push({
        operation: diff[0],
        text: diff[1],
        lineStart: -1,
        lineEndExclusive: -1,
      });
      leftLineCount += countLines(diff[1]);
      rightLineCount += countLines(diff[1]);
    }
  }
  return enhancedDiffs;
}

export function computeSimpleMoves(
  deletions: EnhancedDmpDiff[],
  insertions: EnhancedDmpDiff[],
  simpleIgnoredDeletionLines: Set<number>,
  simpleIgnoredInsertionLines: Set<number>,
  movesTimeout: { amount: number; start: number },
  options: ComputeMoveOptions,
): Moves {
  const deletionToInsertionMap: MovedTo[] = [];
  const insertionToDeletionMap: MovedTo[] = [];

  for (let d = 0; d < deletions.length; d++) {
    const deletion = deletions[d];
    if (simpleIgnoredDeletionLines.has(d)) {
      continue;
    }
    let highestSimilarity = 0;
    let bestInsertion: EnhancedDmpDiff | undefined = undefined;
    let bestLineDifference = Infinity;
    for (let i = 0; i < insertions.length; i++) {
      const insertion = insertions[i];
      if (simpleIgnoredInsertionLines.has(i)) {
        continue;
      }
      const lineDifference = Math.abs(deletion.lineStart - insertion.lineStart);
      if (
        insertionToDeletionMap[insertion.lineStart] !== undefined ||
        !(lineDifference < CODE_MOVES_MAX_LINE_COUNT_BETWEEN_MOVES)
      ) {
        continue;
      }
      const useSimpleComparison =
        deletion.text.length > CODE_MOVES_SIMPLE_COMPARISON_CHAR_THRESHOLD ||
        insertion.text.length > CODE_MOVES_SIMPLE_COMPARISON_CHAR_THRESHOLD ||
        deletions.length > CODE_MOVES_SIMPLE_COMPARISON_DIFF_THRESHOLD ||
        insertions.length > CODE_MOVES_SIMPLE_COMPARISON_DIFF_THRESHOLD;
      const similarity = computeSimilarity(
        deletion.text,
        insertion.text,
        useSimpleComparison,
      );
      if (
        // if similarity of current pair is higher, or equal but closer to each other.
        similarity > highestSimilarity ||
        (similarity === highestSimilarity &&
          lineDifference < bestLineDifference)
      ) {
        highestSimilarity = similarity;
        bestInsertion = insertion;
        bestLineDifference = lineDifference;
      }

      // TIMEOUT CHECKPOINT
      if (!timeoutIsValid(movesTimeout)) {
        // return something equivalent to empty
        return {
          deletionToInsertionMap: [],
          insertionToDeletionMap: [],
        };
      }
    }
    if (
      highestSimilarity >
        (options.simpleMoveSimilarityThreshold ??
          CODE_MOVES_SIMILARITY_THRESHOLD) &&
      bestInsertion !== undefined
    ) {
      // return the best insertion to be paired with that deletion.
      deletionToInsertionMap[deletion.lineStart] = {
        movedFromEndExclusive: deletion.lineEndExclusive,
        movedToStart: bestInsertion.lineStart,
        movedToEndExclusive: bestInsertion.lineEndExclusive,
        score: highestSimilarity,
      };
      insertionToDeletionMap[bestInsertion.lineStart] = {
        movedFromEndExclusive: bestInsertion.lineEndExclusive,
        movedToStart: deletion.lineStart,
        movedToEndExclusive: deletion.lineEndExclusive,
        score: highestSimilarity,
      };
    }
  }

  return {
    deletionToInsertionMap,
    insertionToDeletionMap,
  };
}

export function computeAdvancedMoves(
  deletions: EnhancedDmpDiff[],
  insertions: EnhancedDmpDiff[],
  movesTimeout: { amount: number; start: number },
  simpleMoves: Moves,
  options: ComputeMoveOptions,
) {
  // advancedMoves will be adding to these maps.
  const deletionToInsertionMap = simpleMoves.deletionToInsertionMap;
  const insertionToDeletionMap = simpleMoves.insertionToDeletionMap;

  const deletionLines: Lines = new Map();
  const insertionLines: Lines = new Map();

  deletions
    .filter(
      (deletion) =>
        simpleMoves.deletionToInsertionMap[deletion.lineStart] === undefined,
    )
    .forEach(getSplitFunction(deletionLines, options.minLines));
  insertions
    .filter(
      (insertion) =>
        simpleMoves.insertionToDeletionMap[insertion.lineStart] === undefined,
    )
    .forEach(getSplitFunction(insertionLines, options.minLines));

  // TIMEOUT CHECKOUT #1
  if (!timeoutIsValid(movesTimeout)) {
    return simpleMoves;
  }

  const deletionRanges = new MoveRangeList();
  const insertionRanges = new MoveRangeList();
  // This has to be a map for it to sort properly (can't sort a sparse array properly).
  const tempDeletionChangeMap = new Map<number, MovedTo>();

  // main loop that steps through the lines and adds them if they are a move
  // (semi-brute force algorithm, but its the vscode way)
  for (const [deletionLineNumber, deletionText] of deletionLines) {
    for (const [insertionLineNumber, insertionText] of insertionLines) {
      // if the lines are different, skip.
      // if (deletionText !== insertionText) {
      if (
        deletionText.length < (options.minLineLength ?? 0) ||
        insertionText.length < (options.minLineLength ?? 0) ||
        computeSimilarity(
          deletionText,
          insertionText,
          !options.fullyPartialMatches,
        ) < 0.95
      ) {
        continue;
      }

      // the lines are the same, construct move.
      let deletionEnd = deletionLineNumber + 1;
      let insertionEnd = insertionLineNumber + 1;

      // attempt to extend if possible.
      while (
        options.extendMovesInAdvanced &&
        deletionLines.has(deletionEnd) && // to prevent undef === undef
        deletionLines.get(deletionEnd) === insertionLines.get(insertionEnd)
      ) {
        deletionEnd++;
        insertionEnd++;
      }

      // If move isn't long enough, skip.
      const moveLength = deletionEnd - deletionLineNumber;
      if (moveLength < (options.minLines ?? CODE_MOVES_MIN_NUMBER_OF_LINES)) {
        continue;
      }

      if (
        // this is only to check if a range completely wraps another, not checking for any overlaps.
        // Overlap is checked in the next stage of the algorithm.
        deletionRanges.hasRangesWrapping([deletionLineNumber, deletionEnd]) ||
        insertionRanges.hasRangesWrapping([insertionLineNumber, insertionEnd])
      ) {
        continue;
      }
      deletionRanges.replaceRangesWrappedBy([deletionLineNumber, deletionEnd]);
      insertionRanges.replaceRangesWrappedBy([
        insertionLineNumber,
        insertionEnd,
      ]);
      tempDeletionChangeMap.set(deletionLineNumber, {
        movedFromEndExclusive: deletionEnd,
        movedToStart: insertionLineNumber,
        movedToEndExclusive: insertionEnd,
        score: 1,
      });
    }

    // TIMEOUT CHECKOUT #2
    if (!timeoutIsValid(movesTimeout)) {
      return simpleMoves;
    }
  }

  if (tempDeletionChangeMap.size === 0 || !timeoutIsValid(movesTimeout)) {
    return simpleMoves;
  }

  // sorted by move length, so longest moves get priority.
  const sortedDeletion = Array.from(tempDeletionChangeMap.entries()).sort(
    ([_number, movedTo], [_number2, movedTo2]) =>
      movedTo2.movedToEndExclusive -
      movedTo2.movedToStart -
      movedTo.movedToEndExclusive +
      movedTo.movedToStart,
  );

  // TIMEOUT CHECKOUT #3
  if (!timeoutIsValid(movesTimeout)) {
    return simpleMoves;
  }

  // both trees will have a single [-1, -1] node to start, so its a slight de-optimization
  // but this avoids undefined checks and like 30 lines of unnecessary code.
  const deletionRangeTree = new NonOverlappingRangeTree([-1, -1]);
  const insertionRangeTree = new NonOverlappingRangeTree([-1, -1]);

  for (const move of sortedDeletion) {
    const moveInsertionStart = move[1].movedToStart;
    const moveInsertionEndExclusive = move[1].movedToEndExclusive;
    const moveLength = moveInsertionEndExclusive - moveInsertionStart;
    const moveDeletionStart = move[0];
    const moveDeletionEndExclusive = moveDeletionStart + moveLength;

    // Extend lines across partial matches.
    const extendedMove = options.extendMovesInAdvanced
      ? extendUpAndDown(
          {
            moveDeletionStart,
            moveDeletionEndExclusive,
            moveInsertionStart,
            moveInsertionEndExclusive,
          },
          deletionLines,
          insertionLines,
        )
      : {
          moveDeletionStart,
          moveDeletionEndExclusive,
          moveInsertionStart,
          moveInsertionEndExclusive,
          score: 1,
        };

    // Check for overlap.
    if (
      deletionRangeTree.overlapsWithAny([
        extendedMove.moveDeletionStart,
        extendedMove.moveDeletionEndExclusive,
      ]) ||
      insertionRangeTree.overlapsWithAny([
        extendedMove.moveInsertionStart,
        extendedMove.moveInsertionEndExclusive,
      ])
    ) {
      continue;
    }

    // No overlap, proceed to add.
    deletionRangeTree.addRange([
      extendedMove.moveDeletionStart,
      extendedMove.moveDeletionEndExclusive,
    ]);
    insertionRangeTree.addRange([
      extendedMove.moveInsertionStart,
      extendedMove.moveInsertionEndExclusive,
    ]);
    deletionToInsertionMap[extendedMove.moveDeletionStart] = {
      movedFromEndExclusive: extendedMove.moveDeletionEndExclusive,
      movedToStart: extendedMove.moveInsertionStart,
      movedToEndExclusive: extendedMove.moveInsertionEndExclusive,
      score: extendedMove.score,
    };
    insertionToDeletionMap[extendedMove.moveInsertionStart] = {
      movedFromEndExclusive: extendedMove.moveInsertionEndExclusive,
      movedToStart: extendedMove.moveDeletionStart,
      movedToEndExclusive: extendedMove.moveDeletionEndExclusive,
      score: extendedMove.score,
    };
  }

  return {
    deletionToInsertionMap,
    insertionToDeletionMap,
  };
}

export function countLines(str: string): number {
  let count = 0;
  let index = str.indexOf('\n');
  while (index !== -1) {
    count++;
    index = str.indexOf('\n', index + 1);
  }
  return count;
}

// keeping here for now because this is only used for the extendUpAndDown function.
type FullMoveInfo = {
  moveDeletionStart: number;
  moveDeletionEndExclusive: number;
  moveInsertionStart: number;
  moveInsertionEndExclusive: number;
};

function extendUpAndDown(
  {
    moveDeletionStart,
    moveDeletionEndExclusive,
    moveInsertionStart,
    moveInsertionEndExclusive,
  }: FullMoveInfo,
  deletionLines: Map<number, string>,
  insertionLines: Map<number, string>,
): FullMoveInfo & { score: number } {
  let linesToExtendUp = 0;
  let linesToExtendDown = 0;
  let similarityTotal = moveDeletionEndExclusive - moveDeletionStart;
  let similarityScore = similarityTotal;
  // Extending up.
  while (
    deletionLines.has(moveDeletionStart - linesToExtendUp - 1) &&
    insertionLines.has(moveInsertionStart - linesToExtendUp - 1)
  ) {
    const deletionLine = deletionLines.get(
      moveDeletionStart - linesToExtendUp - 1,
    );
    const insertionLine = insertionLines.get(
      moveInsertionStart - linesToExtendUp - 1,
    );
    const lineSimilarity = computeSimilarity(
      deletionLine!,
      insertionLine!,
      Math.max(deletionLine!.length, insertionLine!.length) >
        CODE_MOVES_LINE_EXTENSION_CHAR_THRESHOLD,
    );
    if (lineSimilarity < CODE_MOVES_PARTIAL_MATCH_THRESHOLD) {
      break;
    }
    similarityTotal++;
    similarityScore += lineSimilarity;
    linesToExtendUp++;
  }
  // Extending down.
  while (
    deletionLines.has(moveDeletionEndExclusive + linesToExtendDown) &&
    insertionLines.has(moveInsertionEndExclusive + linesToExtendDown)
  ) {
    const deletionLine = deletionLines.get(
      moveDeletionEndExclusive + linesToExtendDown,
    );
    const insertionLine = insertionLines.get(
      moveInsertionEndExclusive + linesToExtendDown,
    );
    const lineSimilarity = computeSimilarity(
      deletionLine!,
      insertionLine!,
      Math.max(deletionLine!.length, insertionLine!.length) >
        CODE_MOVES_LINE_EXTENSION_CHAR_THRESHOLD,
    );
    if (lineSimilarity < CODE_MOVES_PARTIAL_MATCH_THRESHOLD) {
      break;
    }
    similarityTotal++;
    similarityScore += lineSimilarity;
    linesToExtendDown++;
  }

  const finalSimilarityScore = similarityScore / similarityTotal;

  return {
    moveDeletionStart: moveDeletionStart - linesToExtendUp,
    moveDeletionEndExclusive: moveDeletionEndExclusive + linesToExtendDown,
    moveInsertionStart: moveInsertionStart - linesToExtendUp,
    moveInsertionEndExclusive: moveInsertionEndExclusive + linesToExtendDown,
    score: finalSimilarityScore,
  };
}

function timeoutIsValid(timeout: { amount: number; start: number }) {
  return Date.now() - timeout.start < timeout.amount * 1000;
}

// vscode computes similarity based on character occurrences in both strings, and computes a score based on differeneces in character count.
function computeSimilarity(
  deletion: string,
  insertion: string,
  useSimpleComparison?: boolean,
): number {
  if (useSimpleComparison) {
    // heuristic to prevent long strings from being histogrammed.
    return deletion === insertion ? 1 : 0;
  }
  const deletionHistogram = constructCharHistogram(deletion);
  const insertionHistogram = constructCharHistogram(insertion);
  let diffCount = 0;
  (deletionHistogram.size > insertionHistogram.size
    ? deletionHistogram
    : insertionHistogram
  ).forEach((_, key) => {
    diffCount += Math.abs(
      (deletionHistogram.get(key) || 0) - (insertionHistogram.get(key) || 0),
    );
  });
  return 1 - diffCount / (deletion.length + insertion.length);
}

function constructCharHistogram(str: string): Map<string, number> {
  const histo = new Map<string, number>();
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    histo.set(ch, (histo.get(ch) || 0) + 1);
  }
  return histo;
}

function getSplitFunction(lineMap: Lines, minLines?: number) {
  return function _splitIntoLines(enhancedDmpDiff: EnhancedDmpDiff) {
    const lineArray = enhancedDmpDiff.text.split('\n');
    // for if the string ends with \n (it theoretically should always end with \n, but just in case for when it doesn't.)
    if (lineArray[lineArray.length - 1].length === 0) {
      lineArray.pop();
    }
    if (lineArray.length < (minLines ?? CODE_MOVES_MIN_NUMBER_OF_LINES)) {
      return;
    }
    for (let i = 0; i < lineArray.length; i++) {
      lineMap.set(enhancedDmpDiff.lineStart + i, lineArray[i]);
    }
  };
}
