import {
  Chunk,
  DiffBlock,
  DiffLevel,
  Meta,
  NormalizeOptions,
  SideData,
} from 'types/normalize';
import { DmpDiff, DiffOperation } from './diff/types';

import {
  diffCharsToLines,
  diffCleanupSemantic,
  diffCleanupSplitSurrogates,
  diffLinesToChars,
  diffLinesToWords,
  diffMain,
} from './diff/googlediff';
import diffDynamicProgramming, {
  createEqualityScoreFnFromLineArray,
} from './diff/dynamic-programming';
import { captureException } from '@sentry/node';
import createApiUrl from './create-api-url';
import axios from 'axios';
import yn from 'yn';
import { computeMoves } from './moves';
import { Moves } from 'types/moves';

async function captureFaultyDiff(diff: { left: string; right: string }) {
  const { data } = await axios.post(createApiUrl(`/diffs`), {
    ...diff,
    expiry: 'forever',
    title: `Error Diff [${Math.random().toString(36).substring(2, 9)}]`,
    isPrivate: false,
    permission: 'view',
  });

  const slug = data.slug;
  captureException(`Diff that caused normalize error: ${slug}`);
}

const defaultNormalizeOptions: Readonly<Required<NormalizeOptions>> = {
  dynamicProgrammingMaxLines: 1700, // maximum number of lines (both sides added) before switching to Myers
  dynamicProgrammingMaxWords: 500, // maximum number of words (per block, both sides added) before switching to Myers
  dynamicProgrammingMaxChars: 500, // maximum number of characters (per block, both sides added) before switching to Myers
  computeMoves: true,
  computeForRichText: false,
};

let normalizeOptions: Required<NormalizeOptions> = {
  ...defaultNormalizeOptions,
};

/**
 * The Diffchecker algorithm. (Technically wrapper over DiffMatchPatch)
 * @param original original string before edits were made.
 * @param changed changed string after edits were made.
 * @param level either word or character level.
 */
export default function normalize(
  original: string,
  changed: string,
  level: DiffLevel,
  options: NormalizeOptions = {},
) {
  try {
    // PART 0: SETUP
    normalizeOptions = {
      ...defaultNormalizeOptions,
      ...options,
    };

    // PART 1: LINE LEVEL DIFF

    // "add new line to the final line so that it will match lines on other side that aren't last"
    // Not really sure what this does, but it was here from 7 years ago so I'll keep it.
    original = original + '\n';
    changed = changed + '\n';
    // Do a character level diff to get the line changes. Converts lines to unicode characters as tokens.
    const tokenized = diffLinesToChars(original, changed);

    let lineDiffs: DmpDiff[];
    const numLines = tokenized.chars1.length + tokenized.chars2.length;
    // If the number of lines is greater than the maxLines, do not use dynamic programming.
    if (numLines > normalizeOptions.dynamicProgrammingMaxLines) {
      lineDiffs = diffMain(tokenized.chars1, tokenized.chars2);
    } else {
      lineDiffs = diffDynamicProgramming(
        tokenized.chars1,
        tokenized.chars2,
        createEqualityScoreFnFromLineArray(tokenized), // prioritize lines with more characters
      );
    }
    // Directly mutates diffs to convert back to actual lines.
    diffCharsToLines(lineDiffs, tokenized.lineArray);
    // Compute moves
    const moves: Moves = normalizeOptions.computeMoves
      ? computeMoves(lineDiffs, {
          extendMovesInAdvanced: !normalizeOptions.computeForRichText,
          minLines: normalizeOptions.computeForRichText ? 1 : 3,
          fullyPartialMatches: normalizeOptions.computeForRichText,
          minLineLength: normalizeOptions.computeForRichText ? 10 : undefined,
        })
      : { deletionToInsertionMap: [], insertionToDeletionMap: [] };

    // PART 2: WORD/CHARACTER LEVEL DIFF INTO META[]

    // These arrays are what we will eventually return.
    const metaArray: Meta[] = [];
    const diffBlocks: DiffBlock[] = [];
    // stats is a tuple to keep track of count for added and removed lines.
    const stats: [number, number] = [0, 0]; // added removed

    // lineNumberPointers is a tuple to keep track the line numbers for both sides
    // its a tuple so that we can pass it into functions by reference for mutation.
    const lineNumberPointers: [number, number] = [0, 0]; // left right

    // diffFunction determines which function will be used for the sub-line-level diff.
    const diffFunction = level === 'word' ? diffLineByWord : diffLineByChar;

    // modern javascript engines don't really have performance gains for caching array length.
    for (let i = 0; i < lineDiffs.length; i++) {
      const action = lineDiffs[i][0];
      const text = lineDiffs[i][1];
      if (
        action === DiffOperation.DELETE &&
        lineDiffs[i + 1] &&
        lineDiffs[i + 1][0] === DiffOperation.INSERT
      ) {
        addChangeBlockRows(
          metaArray,
          diffBlocks,
          stats,
          stripEndingNewlines(text),
          stripEndingNewlines(lineDiffs[i + 1][1]),
          lineNumberPointers,
          diffFunction,
        );
        i++;
      } else {
        addSimpleRows(
          metaArray,
          diffBlocks,
          stats,
          text,
          lineNumberPointers,
          action,
        );
      }
    }

    // PART 3: CLEANUP AND RETURN

    normalizeOptions = { ...defaultNormalizeOptions };

    return {
      rows: metaArray,
      blocks: diffBlocks,
      added: stats[0],
      removed: stats[1],
      moves,
    };
  } catch (e) {
    if (!yn(process.env.NEXT_PUBLIC_IS_ELECTRON)) {
      captureFaultyDiff({
        left: original,
        right: changed,
      }).then((_) => {
        throw e;
      });
    } else {
      throw e;
    }

    return {
      rows: [],
      blocks: [],
      added: 0,
      removed: 0,
    };
  }
}

/**
 * Adds non-inside-changed rows to the metaArray and diffBlocks.
 *
 * @param metaArray The Meta Array
 * @param diffBlocks The DiffBlocks Array
 * @param stats The stats tuple
 * @param lines Array of text lines to add
 * @param lineNumberPointers Line numbers to keep track current line number for both sides
 * @param diffAction Either DiffOperation.DELETE, DiffOperation.INSERT, or DiffOperation.EQUAL
 */
function addSimpleRows(
  metaArray: Meta[],
  diffBlocks: DiffBlock[],
  stats: [number, number],
  text: string,
  lineNumberPointers: [number, number],
  diffAction: number,
) {
  const startingRow = metaArray.length;
  // instead of getting each line by splitting, we use a sliding window and substring to improve memory usage.
  let from = 0;
  let to = text.indexOf('\n', from); // text is guaranteed to have at least one newline.
  while (from < text.length) {
    const str = text.substring(from, to);
    const chunk: Chunk = {
      value: str,
      type:
        diffAction === DiffOperation.INSERT
          ? 'insert'
          : diffAction === DiffOperation.DELETE
            ? 'remove'
            : 'equal',
    };
    metaPush(
      metaArray,
      from === 0,
      false,
      false,
      diffAction === DiffOperation.DELETE || diffAction === DiffOperation.EQUAL
        ? { chunks: [chunk], line: ++lineNumberPointers[0] }
        : undefined, // DEFAULTS TO EMPTY CHUNK
      diffAction === DiffOperation.INSERT || diffAction === DiffOperation.EQUAL
        ? { chunks: [chunk], line: ++lineNumberPointers[1] }
        : undefined,
    );
    if (diffAction === DiffOperation.INSERT) {
      stats[0]++;
    } else if (diffAction === DiffOperation.DELETE) {
      stats[1]++;
    }
    // slide the window
    from = to + 1;
    to = text.indexOf('\n', from);
  }
  metaArray[metaArray.length - 1].end = true;
  const endingRow = metaArray.length - 1;
  diffBlocks.push({
    index: diffBlocks.length,
    lineStart: startingRow,
    lineEnd: endingRow, // DIFFBLOCKS LINE-END IS INCLUSIVE
    type: {
      left: diffAction === DiffOperation.DELETE ? 'remove' : 'equal',
      right: diffAction === DiffOperation.INSERT ? 'insert' : 'equal',
    },
  });
}

/**
 * Adds inside-changed rows to the metaArray and diffBlocks.
 *
 * @param metaArray The Meta Array
 * @param diffBlocks The DiffBlocks Array
 * @param stats The stats tuple
 * @param original Original text
 * @param changed Changed text
 * @param lineNumberPointers Line numbers to keep track current line number for both sides
 * @param diffFunction The diff function to use based on diff-level.
 */
function addChangeBlockRows(
  metaArray: Meta[],
  diffBlocks: DiffBlock[],
  stats: [number, number],
  original: string,
  changed: string,
  lineNumberPointers: [number, number],
  diffFunction: (original: string, changed: string) => DmpDiff[],
) {
  // to prevent empty strings diffs from being removed from computation, we just output a simple
  // remove and insert manually since thats whats going to get outputted anyways.
  const diffs: DmpDiff[] =
    original === '' || changed === ''
      ? [
          [-1, original],
          [1, changed],
        ]
      : diffFunction(original, changed);
  const startingRow = metaArray.length;
  metaPush(metaArray, true, false, true);
  lineNumberPointers[0]++;
  lineNumberPointers[1]++;
  // this is basically lastRightLine and lastLeftLine from the original code, except doesn't need to be "calibrated"
  let leftMetaArrayPointer = startingRow;
  let rightMetaArrayPointer = startingRow;
  // this for loop is responsible for adding the sub-line-level diffs to either side of Meta[], and does so by
  // going through the sub-line-level diffs and adding them to their respective sides, while adding new rows to Meta[] if necessary.
  for (let i = 0; i < diffs.length; i++) {
    // similar to addSimpleRows, we use a sliding window to get each line.
    let from = 0;
    let to = diffs[i][1].indexOf('\n', from);
    // the diffs here MAY not have \n's (unlike simpleRows, which guaranteed ends with \n), so it needs extra checks.
    if (to === -1) {
      to = diffs[i][1].length;
    }
    // when the change block spans over multiple lines, by keeping track of two pointers,
    // we can populate old meta rows with one side after the other. This is necesary for
    // inside-changed rows, where with simpleRows, all we have to do is keep addding new rows to meta.
    while (from <= to) {
      // Adding chunks to rows.
      const chunk: Chunk = {
        value: diffs[i][1].substring(from, to),
        type:
          diffs[i][0] === DiffOperation.INSERT
            ? 'insert'
            : diffs[i][0] === DiffOperation.DELETE
              ? 'remove'
              : 'equal',
      };
      if (
        diffs[i][0] === DiffOperation.EQUAL ||
        diffs[i][0] === DiffOperation.DELETE
      ) {
        metaArray[leftMetaArrayPointer].left.chunks.push(chunk);
        metaArray[leftMetaArrayPointer].left.line = lineNumberPointers[0];
      }
      if (
        diffs[i][0] === DiffOperation.EQUAL ||
        diffs[i][0] === DiffOperation.INSERT
      ) {
        metaArray[rightMetaArrayPointer].right.chunks.push(chunk);
        metaArray[rightMetaArrayPointer].right.line = lineNumberPointers[1];
      }
      if (diffs[i][0] === DiffOperation.INSERT) {
        stats[0]++;
      } else if (diffs[i][0] === DiffOperation.DELETE) {
        stats[1]++;
      }

      // Sliding the window, adding rows if necessary.
      from = to + 1;
      to = diffs[i][1].indexOf('\n', from);
      if (to === -1) {
        to = diffs[i][1].length;
      }
      if (from <= diffs[i][1].length) {
        if (
          diffs[i][0] === DiffOperation.EQUAL ||
          diffs[i][0] === DiffOperation.DELETE
        ) {
          lineNumberPointers[0]++;
          leftMetaArrayPointer++;
        }
        if (
          diffs[i][0] === DiffOperation.EQUAL ||
          diffs[i][0] === DiffOperation.INSERT
        ) {
          lineNumberPointers[1]++;
          rightMetaArrayPointer++;
        }
        if (
          leftMetaArrayPointer === metaArray.length ||
          rightMetaArrayPointer === metaArray.length
        ) {
          metaPush(metaArray, false, false, true);
        }
      }
    }
  }
  metaArray[metaArray.length - 1].end = true;
  const endingRow = metaArray.length - 1;
  diffBlocks.push({
    index: diffBlocks.length,
    lineStart: startingRow,
    lineEnd: endingRow,
    type: {
      left: 'remove',
      right: 'insert',
    },
  });
}

/**
 * metaArray.push() with default values.
 *
 * @param metaArray The Meta Array
 * @param start Is start of a block?
 * @param end Is end of a block?
 * @param insideChanged (DEFAULT `false`) Is inside changed?
 * @param left (DEFAULT `chunk: []`) the left chunk
 * @param right (DEFAULT `chunk: []`) the right chunk
 */
function metaPush(
  metaArray: Meta[],
  start: boolean,
  end: boolean,
  insideChanged: boolean = false,
  left: SideData = { chunks: [] },
  right: SideData = { chunks: [] },
) {
  metaArray.push({
    start,
    end,
    insideChanged,
    left,
    right,
  });
}

/**
 * Self-explanatory.
 */
function stripEndingNewlines(text: string) {
  // faster than endsWith.
  if (text[text.length - 1] === '\n') {
    return text.substring(0, text.length - 1);
  }
  return text;
}

/**
 * Creates a character level diff between two strings.
 */
function diffLineByChar(original: string, changed: string) {
  let diff: DmpDiff[];
  const numChars = original.length + changed.length;
  if (numChars > normalizeOptions.dynamicProgrammingMaxChars) {
    diff = diffMain(original, changed);
  } else {
    diff = diffDynamicProgramming(original, changed);
  }

  diffCleanupSplitSurrogates(diff);
  diffCleanupSemantic(diff, 10);
  return diff;
}

/**
 * Creates a word level diff between two strings through conversion to/from unicode tokens.
 */
function diffLineByWord(original: string, changed: string) {
  const tokens = diffLinesToWords(original, changed);

  let diff: DmpDiff[];
  const numChars = tokens.chars1.length + tokens.chars2.length;
  if (numChars > normalizeOptions.dynamicProgrammingMaxChars) {
    diff = diffMain(tokens.chars1, tokens.chars2);
  } else {
    diff = diffDynamicProgramming(
      tokens.chars1,
      tokens.chars2,
      createEqualityScoreFnFromLineArray(tokens),
    );
  }

  diffCleanupSplitSurrogates(diff);
  diffCleanupSemantic(diff, 3);
  diffCharsToLines(diff, tokens.lineArray);
  return diff;
}
