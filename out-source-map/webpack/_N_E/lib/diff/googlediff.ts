import type { DmpDiff } from './types';
import { DiffOperation } from './types';

const TIMEOUT = 20;

/**
 * Create a diff tuple.
 *
 * @param {number} op Operation, one of: DiffOperation.DELETE, DiffOperation.INSERT, DiffOperation.EQUAL.
 * @param {string} text Text to be deleted, inserted, or retained.
 */
export function createDiff(op: DiffOperation, text: string): DmpDiff {
  return [op, text];
}

/**
 * Find the differences between two texts.  Simplifies the problem by stripping
 * any common prefix or suffix off the texts before diffing.
 * @param text1 Old string to be diffed.
 * @param text2 New string to be diffed.
 * @param opt_checklines Optional speedup flag. If present and false,
 *     then don't run a line-level diff first to identify the changed areas.
 *     Defaults to true, which does a faster, slightly less optimal diff.
 * @param opt_deadline Optional time when the diff should be complete
 *     by.  Used internally for recursive calls.  Users should set DiffTimeout
 *     instead.
 * @return {DmpDiff[]} Array of diff tuples.
 */
export function diffMain(
  text1: string,
  text2: string,
  opt_checklines = true,
  opt_deadline?: number,
) {
  const deadline = opt_deadline ?? new Date().getTime() + TIMEOUT * 1000;

  // Check for null inputs.
  if (text1 == null || text2 == null) {
    throw new Error('Null input. (diff_main)');
  }

  // Check for equality (speedup).
  if (text1 === text2) {
    if (text1) {
      return [createDiff(DiffOperation.EQUAL, text1)];
    }
    return [];
  }

  const checklines = opt_checklines;

  // Trim off common prefix (speedup).
  let commonlength = diffCommonPrefix(text1, text2);
  const commonprefix = text1.substring(0, commonlength);
  text1 = text1.substring(commonlength);
  text2 = text2.substring(commonlength);

  // Trim off common suffix (speedup).
  commonlength = diffCommonSuffix(text1, text2);
  const commonsuffix = text1.substring(text1.length - commonlength);
  text1 = text1.substring(0, text1.length - commonlength);
  text2 = text2.substring(0, text2.length - commonlength);

  // Compute the diff on the middle block.
  const diffs = diffCompute(text1, text2, checklines, deadline);

  // Restore the prefix and suffix.
  if (commonprefix) {
    diffs.unshift(createDiff(DiffOperation.EQUAL, commonprefix));
  }

  if (commonsuffix) {
    diffs.push(createDiff(DiffOperation.EQUAL, commonsuffix));
  }

  diffCleanupMerge(diffs);
  return diffs;
}

/**
 * Find the differences between two texts.  Assumes that the texts do not
 * have any common prefix or suffix.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {boolean} checklines Speedup flag.  If false, then don't run a
 *     line-level diff first to identify the changed areas.
 *     If true, then run a faster, slightly less optimal diff.
 * @param {number} deadline Time when the diff should be complete by.
 * @return {DmpDiff[]} Array of diff tuples.
 * @private
 */
function diffCompute(
  text1: string,
  text2: string,
  checklines: boolean,
  deadline: number,
): DmpDiff[] {
  let diffs;

  if (!text1) {
    // Just add some text (speedup).
    return [createDiff(DiffOperation.INSERT, text2)];
  }

  if (!text2) {
    // Just delete some text (speedup).
    return [createDiff(DiffOperation.DELETE, text1)];
  }

  const longtext = text1.length > text2.length ? text1 : text2;
  const shorttext = text1.length > text2.length ? text2 : text1;
  const i = longtext.indexOf(shorttext);
  if (i !== -1) {
    // Shorter text is inside the longer text (speedup).
    diffs = [
      createDiff(DiffOperation.INSERT, longtext.substring(0, i)),
      createDiff(DiffOperation.EQUAL, shorttext),
      createDiff(
        DiffOperation.INSERT,
        longtext.substring(i + shorttext.length),
      ),
    ];
    // Swap insertions for deletions if diff is reversed.
    if (text1.length > text2.length) {
      diffs[0][0] = diffs[2][0] = DiffOperation.DELETE;
    }

    return diffs;
  }

  if (shorttext.length === 1) {
    // Single character string.
    // After the previous speedup, the character can't be an equality.
    return [
      createDiff(DiffOperation.DELETE, text1),
      createDiff(DiffOperation.INSERT, text2),
    ];
  }

  // Check to see if the problem can be split in two.
  const hm = diffHalfMatch(text1, text2);
  if (hm) {
    // A half-match was found, sort out the return data.
    const text1_a = hm[0];
    const text1_b = hm[1];
    const text2_a = hm[2];
    const text2_b = hm[3];
    const mid_common = hm[4];
    // Send both pairs off for separate processing.
    const diffs_a = diffMain(text1_a, text2_a, checklines, deadline);
    const diffs_b = diffMain(text1_b, text2_b, checklines, deadline);
    // Merge the results
    return diffs_a.concat(
      [createDiff(DiffOperation.EQUAL, mid_common)],
      diffs_b,
    );
  }

  if (checklines && text1.length > 100 && text2.length > 100) {
    return diffLineMode(text1, text2, deadline);
  }

  return diffBisect(text1, text2, deadline);
}

/**
 * Do a quick line-level diff on both strings, then re-diff the parts for
 * greater accuracy.
 * This speedup can produce non-minimal diffs.
 * @param text1 Old string to be diffed.
 * @param text2 New string to be diffed.
 * @param deadline Time when the diff should be complete by.
 * @return {DmpDiff[]} Array of diff tuples.
 * @private
 */
function diffLineMode(text1: string, text2: string, deadline: number) {
  // Scan the text on a line-by-line basis first.
  const a = diffLinesToChars(text1, text2);
  text1 = a.chars1;
  text2 = a.chars2;
  const linearray = a.lineArray;

  const diffs = diffMain(text1, text2, false, deadline);

  // Convert the diff back to original text.
  diffCharsToLines(diffs, linearray);
  // Eliminate freak matches (e.g. blank lines)
  diffCleanupSemantic(diffs);

  // Re-diff any replacement blocks, this time character-by-character.
  // Add a dummy entry at the end.
  diffs.push(createDiff(DiffOperation.EQUAL, ''));
  let pointer = 0;
  let count_delete = 0;
  let count_insert = 0;
  let text_delete = '';
  let text_insert = '';
  while (pointer < diffs.length) {
    switch (diffs[pointer][0]) {
      case DiffOperation.INSERT:
        count_insert++;
        text_insert += diffs[pointer][1];
        break;
      case DiffOperation.DELETE:
        count_delete++;
        text_delete += diffs[pointer][1];
        break;
      case DiffOperation.EQUAL:
        // Upon reaching an equality, check for prior redundancies.
        if (count_delete >= 1 && count_insert >= 1) {
          // Delete the offending records and add the merged ones.
          diffs.splice(
            pointer - count_delete - count_insert,
            count_delete + count_insert,
          );
          pointer = pointer - count_delete - count_insert;
          const subDiff = diffMain(text_delete, text_insert, false, deadline);
          for (let j = subDiff.length - 1; j >= 0; j--) {
            diffs.splice(pointer, 0, subDiff[j]);
          }

          pointer = pointer + subDiff.length;
        }
        count_insert = 0;
        count_delete = 0;
        text_delete = '';
        text_insert = '';
        break;
    }
    pointer++;
  }
  diffs.pop(); // Remove the dummy entry at the end.

  return diffs;
}

/**
 * Find the 'middle snake' of a diff, split the problem in two
 * and return the recursively constructed diff.
 *
 * Diffchecker modification: diff_bisect now accounts for consecutive diagonal scores
 * and will only bisect down the path with the max diagonal score. This still ensures that
 * The LCS path is taken, since it will always choose one of the best paths avaiable, but
 * it will most likely choose the LCS path with more consecutive diagonals, at the slight
 * cost of a bit more time complexity.
 *
 * See Myers 1986 paper: An O(ND) Difference Algorithm and Its Variations.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {number} deadline Time at which to bail if not yet complete.
 * @return {DmpDiff[]} Array of diff tuples.
 * @private
 */
export function diffBisect(text1: string, text2: string, deadline: number) {
  // Cache the text lengths to prevent multiple calls.
  const text1_length = text1.length;
  const text2_length = text2.length;
  const max_d = Math.ceil((text1_length + text2_length) / 2);
  const v_offset = max_d;
  const v_length = 2 * max_d;
  const v1 = new Array(v_length).fill(-1);
  // these new v1diag and v2diag arrays store consecutive diagonal scores for the front and reverse paths,
  // meant to be kept in sync with the v1 and v2 arrays.
  const v1diag = new Array(v_length).fill(-1);
  const v2 = new Array(v_length).fill(-1);
  const v2diag = new Array(v_length).fill(-1);
  // Setting all elements to -1 is faster in Chrome & Firefox than mixing
  // integers and undefined.

  v1[v_offset + 1] = 0;
  v2[v_offset + 1] = 0;
  const delta = text1_length - text2_length;
  // If the total number of characters is odd, then the front path will collide
  // with the reverse path.
  const front = delta % 2 !== 0;
  // Offsets for start and end of k loop.
  // Prevents mapping of space beyond the grid.
  let k1start = 0;
  let k1end = 0;
  let k2start = 0;
  let k2end = 0;
  for (let d = 0; d < max_d; d++) {
    // Bail out if deadline is reached.
    if (new Date().getTime() > deadline) {
      break;
    }

    // The best bisecting coordinates will be stored with these variables.
    let x_to_bisect = -1;
    let y_to_bisect = -1;
    let lastDiagScore = -1;

    // Walk the front path one step.
    for (let k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
      const k1_offset = v_offset + k1;
      let x1: number;
      let diagCount: number;

      // path picking
      // here, after it picks the path, it will also store the consecutive diagonal score from that path.
      if (k1 === -d || (k1 !== d && v1[k1_offset - 1] < v1[k1_offset + 1])) {
        x1 = v1[k1_offset + 1];
        diagCount = v1diag[k1_offset + 1];
      } else {
        x1 = v1[k1_offset - 1] + 1;
        diagCount = v1diag[k1_offset - 1];
      }
      let y1 = x1 - k1;

      // snaking
      // snaking also now counts the number of consecutive diagonals it snakes down, and
      // if it is higher than its previous best, it will update its diagonal score to the new best.
      let curDiagCount = 0;

      while (
        x1 < text1_length &&
        y1 < text2_length &&
        text1.charAt(x1) === text2.charAt(y1)
      ) {
        x1++;
        y1++;
        curDiagCount++;
      }
      v1[k1_offset] = x1;
      const diagScore = Math.max(diagCount, curDiagCount);
      v1diag[k1_offset] = diagScore;

      if (x1 > text1_length) {
        // Ran off the right of the graph.
        k1end += 2;
      } else if (y1 > text2_length) {
        // Ran off the bottom of the graph.
        k1start += 2;
      } else if (front) {
        const k2_offset = v_offset + delta - k1;
        if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] !== -1) {
          // Mirror x2 onto top-left coordinate system.
          const x2 = text1_length - v2[k2_offset];
          if (x1 >= x2 && diagScore > lastDiagScore) {
            // Overlap detected. This used to immediately return a bisect with the x1, y1 coordiinates.
            // However, this too greedily finds sub-optimal messy paths, so we now store
            //the best x and y to bisect, and once we finish this d-layer iteration we
            // use the best one we found with the most diagonals as the actual bisect point,
            // and this way the divide and conquer bisecting will lean more towards a path with more diagonals,
            // while still being one of the best paths in terms of LCS.
            x_to_bisect = x1;
            y_to_bisect = y1;
            lastDiagScore = diagScore;
          }
        }
      }
    }

    if (x_to_bisect != -1) {
      // now in this current d-layer iteration, if we did end
      // up finding a suitable x and y to bisect we do it here.
      return diffBisectSplit(text1, text2, x_to_bisect, y_to_bisect, deadline);
    }
    lastDiagScore = -1;
    // Walk the reverse path one step. The reverse d-layer iterations
    // also have the same maximizing diagonal score logic as above.
    for (let k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
      const k2_offset = v_offset + k2;
      let x2: number;
      let diagCount: number;

      if (k2 === -d || (k2 !== d && v2[k2_offset - 1] < v2[k2_offset + 1])) {
        x2 = v2[k2_offset + 1];
        diagCount = v2diag[k2_offset + 1];
      } else {
        x2 = v2[k2_offset - 1] + 1;
        diagCount = v2diag[k2_offset - 1];
      }
      let y2 = x2 - k2;
      let curDiagCount = 0;

      while (
        x2 < text1_length &&
        y2 < text2_length &&
        text1.charAt(text1_length - x2 - 1) ===
          text2.charAt(text2_length - y2 - 1)
      ) {
        x2++;
        y2++;
        curDiagCount++;
      }
      v2[k2_offset] = x2;
      const diagScore = Math.max(diagCount, curDiagCount);
      v2diag[k2_offset] = diagScore;

      if (x2 > text1_length) {
        // Ran off the left of the graph.
        k2end += 2;
      } else if (y2 > text2_length) {
        // Ran off the top of the graph.
        k2start += 2;
      } else if (!front) {
        const k1_offset = v_offset + delta - k2;
        if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] !== -1) {
          const x1 = v1[k1_offset];
          const y1 = v_offset + x1 - k1_offset;
          // Mirror x2 onto top-left coordinate system.
          x2 = text1_length - x2;
          if (x1 >= x2 && diagScore > lastDiagScore) {
            // Overlap detected. With same diagonal maximizing logic as before.
            x_to_bisect = x1;
            y_to_bisect = y1;
            lastDiagScore = diagScore;
          }
        }
      }
      if (x_to_bisect != -1) {
        return diffBisectSplit(
          // if we did end up finding a suitable x and y to bisect in the reverse iteration we do it here.
          text1,
          text2,
          x_to_bisect,
          y_to_bisect,
          deadline,
        );
      }
    }
  }
  // Diff took too long and hit the deadline or
  // number of diffs equals number of characters, no commonality at all.
  return [
    createDiff(DiffOperation.DELETE, text1),
    createDiff(DiffOperation.INSERT, text2),
  ];
}

/**
 * Given the location of the 'middle snake', split the diff in two parts
 * and recurse.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {number} x Index of split point in text1.
 * @param {number} y Index of split point in text2.
 * @param {number} deadline Time at which to bail if not yet complete.
 * @return {DmpDiff[]} Array of diff tuples.
 * @private
 */
function diffBisectSplit(
  text1: string,
  text2: string,
  x: number,
  y: number,
  deadline: number,
) {
  const text1a = text1.substring(0, x);
  const text2a = text2.substring(0, y);
  const text1b = text1.substring(x);
  const text2b = text2.substring(y);

  // Compute both diffs serially.
  const diffs = diffMain(text1a, text2a, false, deadline);
  const diffsb = diffMain(text1b, text2b, false, deadline);

  return diffs.concat(diffsb);
}

/**
 * Split two texts into an array of strings.  Reduce the texts to a string of
 * hashes where each Unicode character represents one line.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {{chars1: string, chars2: string, lineArray: !Array.<string>}}
 *     An object containing the encoded text1, the encoded text2 and
 *     the array of unique strings.
 *     The zeroth element of the array of unique strings is intentionally blank.
 * @private
 */
export function diffLinesToChars(text1: string, text2: string) {
  const lineArray: string[] = []; // e.g. lineArray[4] == 'Hello\n'
  const lineHash: Map<string, number> = new Map(); // e.g. lineHash['Hello\n'] == 4

  // '\x00' is a valid character, but various debuggers don't like it.
  // So we'll insert a junk entry to avoid generating a null character.
  lineArray[0] = '';

  /**
   * Split a text into an array of strings.  Reduce the texts to a string of
   * hashes where each Unicode character represents one line.
   * Modifies linearray and linehash through being a closure.
   * @param {string} text String to encode.
   * @return {string} Encoded string.
   * @private
   */
  function diffLinesToCharsMunge(text: string) {
    let chars = '';
    // Walk the text, pulling out a substring for each line.
    // text.split('\n') would would temporarily double our memory footprint.
    // Modifying text would create many large strings to garbage collect.
    let lineStart = 0;
    let lineEnd = -1;
    // Keeping our own length variable is faster than looking it up.
    let lineArrayLength = lineArray.length;
    while (lineEnd < text.length - 1) {
      lineEnd = text.indexOf('\n', lineStart);
      if (lineEnd === -1) {
        lineEnd = text.length - 1;
      }

      const line = text.substring(lineStart, lineEnd + 1);

      const lineHashValue = lineHash.get(line);
      if (lineHashValue !== undefined) {
        chars += String.fromCodePoint(
          arrayIndexToValidCodePoint(lineHashValue),
        );
      } else {
        chars += String.fromCodePoint(
          arrayIndexToValidCodePoint(lineArrayLength),
        );
        lineHash.set(line, lineArrayLength);
        lineArray[lineArrayLength++] = line;
      }
      lineStart = lineEnd + 1;
    }
    return chars;
  }

  const chars1 = diffLinesToCharsMunge(text1);
  const chars2 = diffLinesToCharsMunge(text2);
  return { chars1, chars2, lineArray };
}

export function diffLinesToWords(text1: string, text2: string) {
  const wordArray: string[] = []; // e.g. wordArray[4] == 'Hello'
  const wordHash: Map<string, number> = new Map(); // e.g. wordHash['Hello'] == 4

  // '\x00' is a valid character, but various debuggers don't like it.
  // So we'll insert a junk entry to avoid generating a null character.
  wordArray[0] = '';

  /**
   * Split a text into an array of strings.  Reduce the texts to a string of
   * hashes where each Unicode character represents one line.
   * Modifies linearray and linehash through being a closure.
   * @param {string} text String to encode.
   * @return {string} Encoded string.
   * @private
   */
  function diffLinesToWordsMunge(text: string) {
    let chars = '';
    // Walk the text, pulling out a substring for each word.
    // text.split('\n') would would temporarily double our memory footprint.
    // Modifying text would create many large strings to garbage collect.
    let wordStart = 0;
    let wordEnd = -1;
    // Keeping our own length variable is faster than looking it up.
    let wordArrayLength = wordArray.length;
    while (wordEnd < text.length - 1) {
      const spaceIndex = text.indexOf(' ', wordStart);
      const nlineIndex = text.indexOf('\n', wordStart);
      const bothNotFound = spaceIndex === -1 && nlineIndex === -1;
      const oneNotFound = spaceIndex === -1 || nlineIndex === -1;

      wordEnd = bothNotFound
        ? -1
        : oneNotFound
          ? Math.max(spaceIndex, nlineIndex)
          : Math.min(spaceIndex, nlineIndex);

      if (wordEnd === -1) {
        wordEnd = text.length - 1;
      } else if (wordEnd !== wordStart) {
        wordEnd--;
      }

      const word = text.substring(wordStart, wordEnd + 1);
      wordStart = wordEnd + 1;

      const wordHashValue = wordHash.get(word);
      if (wordHashValue !== undefined) {
        chars += String.fromCodePoint(
          arrayIndexToValidCodePoint(wordHashValue),
        );
      } else {
        chars += String.fromCodePoint(
          arrayIndexToValidCodePoint(wordArrayLength),
        );
        wordHash.set(word, wordArrayLength);
        wordArray[wordArrayLength++] = word;
      }
    }
    return chars;
  }

  const chars1 = diffLinesToWordsMunge(text1);
  const chars2 = diffLinesToWordsMunge(text2);
  return { chars1, chars2, lineArray: wordArray };
}

/**
 * Rehydrate the text in a diff from a string of line hashes to real lines of
 * text.
 * @param {DmpDiff[]} diffs Array of diff tuples.
 * @param {!Array.<string>} lineArray Array of unique strings.
 * @private
 */
export function diffCharsToLines(diffs: DmpDiff[], lineArray: string[]) {
  for (let i = 0; i < diffs.length; i++) {
    const chars = diffs[i][1];
    const text: string[] = [];

    for (let j = 0, k = 0; j < chars.length; j++, k++) {
      const codePoint = chars.codePointAt(j)!;
      text[k] = lineArray[codePointToValidArrayIndex(codePoint)];
      if (codePoint > 0xffff) {
        j++;
      }
    }

    diffs[i][1] = text.join('');
  }
}

/**
 * Determine the common prefix of two strings.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the start of each
 *     string.
 */
export function diffCommonPrefix(text1: string, text2: string): number {
  // Quick check for common null cases.
  if (!text1 || !text2 || text1.charAt(0) !== text2.charAt(0)) {
    return 0;
  }

  // Binary search.
  // Performance analysis: https://neil.fraser.name/news/2007/10/09/
  let pointermin = 0;
  let pointermax = Math.min(text1.length, text2.length);
  let pointermid = pointermax;
  let pointerstart = 0;
  while (pointermin < pointermid) {
    if (
      text1.substring(pointerstart, pointermid) ===
      text2.substring(pointerstart, pointermid)
    ) {
      pointermin = pointermid;
      pointerstart = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }
  return pointermid;
}

/**
 * Determine the common suffix of two strings.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the end of each string.
 */
export function diffCommonSuffix(text1: string, text2: string): number {
  // Quick check for common null cases.
  if (
    !text1 ||
    !text2 ||
    text1.charAt(text1.length - 1) !== text2.charAt(text2.length - 1)
  ) {
    return 0;
  }

  // Binary search.
  // Performance analysis: https://neil.fraser.name/news/2007/10/09/
  let pointermin = 0;
  let pointermax = Math.min(text1.length, text2.length);
  let pointermid = pointermax;
  let pointerend = 0;
  while (pointermin < pointermid) {
    if (
      text1.substring(text1.length - pointermid, text1.length - pointerend) ===
      text2.substring(text2.length - pointermid, text2.length - pointerend)
    ) {
      pointermin = pointermid;
      pointerend = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }
  return pointermid;
}

/**
 * Determine if the suffix of one string is the prefix of another.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the end of the first
 *     string and the start of the second string.
 * @private
 */
export function diffCommonOverlap(text1: string, text2: string): number {
  // Cache the text lengths to prevent multiple calls.
  const text1_length = text1.length;
  const text2_length = text2.length;
  // Eliminate the null case.
  if (text1_length === 0 || text2_length === 0) {
    return 0;
  }

  // Truncate the longer string.
  if (text1_length > text2_length) {
    text1 = text1.substring(text1_length - text2_length);
  } else if (text1_length < text2_length) {
    text2 = text2.substring(0, text1_length);
  }

  const text_length = Math.min(text1_length, text2_length);
  // Quick check for the worst case.
  if (text1 === text2) {
    return text_length;
  }

  // Start by looking for a single character match
  // and increase length until no match is found.
  // Performance analysis: https://neil.fraser.name/news/2010/11/04/
  let best = 0;
  let length = 1;
  while (true) {
    const pattern = text1.substring(text_length - length);
    const found = text2.indexOf(pattern);
    if (found === -1) {
      return best;
    }

    length += found;
    if (
      found === 0 ||
      text1.substring(text_length - length) === text2.substring(0, length)
    ) {
      best = length;
      length++;
    }
  }
}

/**
 * Do the two texts share a substring which is at least half the length of the
 * longer text?
 * This speedup can produce non-minimal diffs.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {Array.<string>} Five element Array, containing the prefix of
 *     text1, the suffix of text1, the prefix of text2, the suffix of
 *     text2 and the common middle.  Or null if there was no match.
 * @private
 */
export function diffHalfMatch(text1: string, text2: string) {
  const longtext = text1.length > text2.length ? text1 : text2;
  const shorttext = text1.length > text2.length ? text2 : text1;
  if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
    return null;
  } // Pointless.

  // const dmp = this // 'this' becomes 'window' in a closure.
  /**
   * Does a substring of shorttext exist within longtext such that the substring
   * is at least half the length of longtext?
   * Closure, but does not reference any external variables.
   * @param {string} longtext Longer string.
   * @param {string} shorttext Shorter string.
   * @param {number} i Start index of quarter length substring within longtext.
   * @return {Array.<string>} Five element Array, containing the prefix of
   *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
   *     of shorttext and the common middle.  Or null if there was no match.
   * @private
   */
  function diffHalfMatchI(
    longtext: string,
    shorttext: string,
    i: number,
  ): string[] | null {
    // Start with a 1/4 length substring at position i as a seed.
    const seed = longtext.substring(i, i + Math.floor(longtext.length / 4));
    let j = -1;
    let best_common = '';
    let best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;
    // eslint-disable-next-line no-cond-assign
    while ((j = shorttext.indexOf(seed, j + 1)) !== -1) {
      const prefixLength = diffCommonPrefix(
        longtext.substring(i),
        shorttext.substring(j),
      );
      const suffixLength = diffCommonSuffix(
        longtext.substring(0, i),
        shorttext.substring(0, j),
      );
      if (best_common.length < suffixLength + prefixLength) {
        best_common =
          shorttext.substring(j - suffixLength, j) +
          shorttext.substring(j, j + prefixLength);
        best_longtext_a = longtext.substring(0, i - suffixLength);
        best_longtext_b = longtext.substring(i + prefixLength);
        best_shorttext_a = shorttext.substring(0, j - suffixLength);
        best_shorttext_b = shorttext.substring(j + prefixLength);
      }
    }
    if (best_common.length * 2 >= longtext.length) {
      return [
        best_longtext_a!,
        best_longtext_b!,
        best_shorttext_a!,
        best_shorttext_b!,
        best_common,
      ];
    } else {
      return null;
    }
  }

  // First check if the second quarter is the seed for a half-match.
  const hm1 = diffHalfMatchI(
    longtext,
    shorttext,
    Math.ceil(longtext.length / 4),
  );
  // Check again based on the third quarter.
  const hm2 = diffHalfMatchI(
    longtext,
    shorttext,
    Math.ceil(longtext.length / 2),
  );

  let hm: string[];
  if (!hm1 && !hm2) {
    return null;
  } else if (!hm2) {
    hm = hm1!;
  } else if (!hm1) {
    hm = hm2;
  } else {
    // Both matched.  Select the longest.
    hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
  }

  // A half-match was found, sort out the return data.
  let text1_a, text1_b, text2_a, text2_b;
  if (text1.length > text2.length) {
    text1_a = hm[0];
    text1_b = hm[1];
    text2_a = hm[2];
    text2_b = hm[3];
  } else {
    text2_a = hm[0];
    text2_b = hm[1];
    text1_a = hm[2];
    text1_b = hm[3];
  }
  const mid_common = hm[4];
  return [text1_a, text1_b, text2_a, text2_b, mid_common];
}

/**
 * Reduce the number of edits by eliminating semantically trivial equalities.
 * @param {DmpDiff[]} diffs Array of diff tuples.
 * @param {number} threshold How many tokens necessary to stop merge equality into surrounding edits. 0 for no merging.
 */
export function diffCleanupSemantic(diffs: DmpDiff[], threshold = Infinity) {
  let changes = false;
  const equalities: number[] = []; // Stack of indices where equalities are found.
  let equalitiesLength = 0; // Keeping our own length var is faster in JS.

  /** @type {?string} */
  let lastEquality: string | null = null;
  // Always equal to diffs[equalities[equalitiesLength - 1]][1]
  let pointer = 0; // Index of current position.

  // Number of characters that changed prior to the equality.
  let length_insertions1 = 0;
  let length_deletions1 = 0;
  // Number of characters that changed after the equality.
  let length_insertions2 = 0;
  let length_deletions2 = 0;
  while (pointer < diffs.length) {
    if (diffs[pointer][0] === DiffOperation.EQUAL) {
      // Equality found.
      equalities[equalitiesLength++] = pointer;
      length_insertions1 = length_insertions2;
      length_deletions1 = length_deletions2;
      length_insertions2 = 0;
      length_deletions2 = 0;
      lastEquality = diffs[pointer][1];
    } else {
      // An insertion or deletion.
      if (diffs[pointer][0] === DiffOperation.INSERT) {
        length_insertions2 += diffs[pointer][1].length;
      } else {
        length_deletions2 += diffs[pointer][1].length;
      }

      // Eliminate an equality that is smaller or equal to the edits on both
      // sides of it.
      if (
        lastEquality &&
        lastEquality.length <= threshold &&
        lastEquality.length <=
          Math.max(length_insertions1, length_deletions1) &&
        lastEquality.length <= Math.max(length_insertions2, length_deletions2)
      ) {
        // Duplicate record.
        diffs.splice(
          equalities[equalitiesLength - 1],
          0,
          createDiff(DiffOperation.DELETE, lastEquality),
        );
        // Change second copy to insert.
        diffs[equalities[equalitiesLength - 1] + 1][0] = DiffOperation.INSERT;
        // Throw away the equality we just deleted.
        equalitiesLength--;
        // Throw away the previous equality (it needs to be reevaluated).
        equalitiesLength--;
        pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
        length_insertions1 = 0; // Reset the counters.
        length_deletions1 = 0;
        length_insertions2 = 0;
        length_deletions2 = 0;
        lastEquality = null;
        changes = true;
      }
    }
    pointer++;
  }

  // Normalize the diff.
  if (changes) {
    diffCleanupMerge(diffs);
  }

  diffCleanupSemanticLossless(diffs);

  // Find any overlaps between deletions and insertions.
  // e.g: <del>abcxxx</del><ins>xxxdef</ins>
  //   -> <del>abc</del>xxx<ins>def</ins>
  // e.g: <del>xxxabc</del><ins>defxxx</ins>
  //   -> <ins>def</ins>xxx<del>abc</del>
  // Only extract an overlap if it is as big as the edit ahead or behind it.
  pointer = 1;
  while (pointer < diffs.length) {
    if (
      diffs[pointer - 1][0] === DiffOperation.DELETE &&
      diffs[pointer][0] === DiffOperation.INSERT
    ) {
      const deletion = diffs[pointer - 1][1];
      const insertion = diffs[pointer][1];
      const overlap_length1 = diffCommonOverlap(deletion, insertion);
      const overlap_length2 = diffCommonOverlap(insertion, deletion);
      if (overlap_length1 >= overlap_length2) {
        if (
          overlap_length1 >= deletion.length / 2 ||
          overlap_length1 >= insertion.length / 2
        ) {
          // Overlap found.  Insert an equality and trim the surrounding edits.
          diffs.splice(
            pointer,
            0,
            createDiff(
              DiffOperation.EQUAL,
              insertion.substring(0, overlap_length1),
            ),
          );
          diffs[pointer - 1][1] = deletion.substring(
            0,
            deletion.length - overlap_length1,
          );
          diffs[pointer + 1][1] = insertion.substring(overlap_length1);
          pointer++;
        }
      } else {
        if (
          overlap_length2 >= deletion.length / 2 ||
          overlap_length2 >= insertion.length / 2
        ) {
          // Reverse overlap found.
          // Insert an equality and swap and trim the surrounding edits.
          diffs.splice(
            pointer,
            0,
            createDiff(
              DiffOperation.EQUAL,
              deletion.substring(0, overlap_length2),
            ),
          );
          diffs[pointer - 1][0] = DiffOperation.INSERT;
          diffs[pointer - 1][1] = insertion.substring(
            0,
            insertion.length - overlap_length2,
          );
          diffs[pointer + 1][0] = DiffOperation.DELETE;
          diffs[pointer + 1][1] = deletion.substring(overlap_length2);
          pointer++;
        }
      }
      pointer++;
    }
    pointer++;
  }
}

const nonAlphaNumericRegex_ = /[^a-zA-Z0-9]/;
const whitespaceRegex_ = /\s/;
const linebreakRegex_ = /[\r\n]/;
const blanklineEndRegex_ = /\n\r?\n$/;
const blanklineStartRegex_ = /^\r?\n\r?\n/;

/**
 * Look for single edits surrounded on both sides by equalities
 * which can be shifted sideways to align the edit to a word boundary.
 * e.g: The c<ins>at c</ins>ame. -> The <ins>cat </ins>came.
 * @param {DmpDiff[]} diffs Array of diff tuples.
 */
export function diffCleanupSemanticLossless(diffs: DmpDiff[]) {
  /**
   * Given two strings, compute a score representing whether the internal
   * boundary falls on logical boundaries.
   * Scores range from 6 (best) to 0 (worst).
   * Closure, but does not reference any external variables.
   * @param {string} one First string.
   * @param {string} two Second string.
   * @return {number} The score.
   * @private
   */
  function diffCleanupSemanticScore(one: string, two: string) {
    if (!one || !two) {
      // Edges are the best.
      return 6;
    }

    // Each port of this function behaves slightly differently due to
    // subtle differences in each language's definition of things like
    // 'whitespace'.  Since this function's purpose is largely cosmetic,
    // the choice has been made to use each language's native features
    // rather than force total conformity.
    const char1 = one.charAt(one.length - 1);
    const char2 = two.charAt(0);
    const nonAlphaNumeric1 = char1.match(nonAlphaNumericRegex_);
    const nonAlphaNumeric2 = char2.match(nonAlphaNumericRegex_);
    const whitespace1 = nonAlphaNumeric1 && char1.match(whitespaceRegex_);
    const whitespace2 = nonAlphaNumeric2 && char2.match(whitespaceRegex_);
    const lineBreak1 = whitespace1 && char1.match(linebreakRegex_);
    const lineBreak2 = whitespace2 && char2.match(linebreakRegex_);
    const blankLine1 = lineBreak1 && one.match(blanklineEndRegex_);
    const blankLine2 = lineBreak2 && two.match(blanklineStartRegex_);

    if (blankLine1 || blankLine2) {
      // Five points for blank lines.
      return 5;
    } else if (lineBreak1 || lineBreak2) {
      // Four points for line breaks.
      return 4;
    } else if (nonAlphaNumeric1 && !whitespace1 && whitespace2) {
      // Three points for end of sentences.
      return 3;
    } else if (whitespace1 || whitespace2) {
      // Two points for whitespace.
      return 2;
    } else if (nonAlphaNumeric1 || nonAlphaNumeric2) {
      // One point for non-alphanumeric.
      return 1;
    }
    return 0;
  }

  let pointer = 1;
  // Intentionally ignore the first and last element (don't need checking).
  while (pointer < diffs.length - 1) {
    if (
      diffs[pointer - 1][0] === DiffOperation.EQUAL &&
      diffs[pointer + 1][0] === DiffOperation.EQUAL
    ) {
      // This is a single edit surrounded by equalities.
      let equality1 = diffs[pointer - 1][1];
      let edit = diffs[pointer][1];
      let equality2 = diffs[pointer + 1][1];

      // First, shift the edit as far left as possible.
      const commonOffset = diffCommonSuffix(equality1, edit);
      if (commonOffset) {
        const commonString = edit.substring(edit.length - commonOffset);
        equality1 = equality1.substring(0, equality1.length - commonOffset);
        edit = commonString + edit.substring(0, edit.length - commonOffset);
        equality2 = commonString + equality2;
      }

      // Second, step character by character right, looking for the best fit.
      let bestEquality1 = equality1;
      let bestEdit = edit;
      let bestEquality2 = equality2;
      let bestScore =
        diffCleanupSemanticScore(equality1, edit) +
        diffCleanupSemanticScore(edit, equality2);
      while (edit.charAt(0) === equality2.charAt(0)) {
        equality1 += edit.charAt(0);
        edit = edit.substring(1) + equality2.charAt(0);
        equality2 = equality2.substring(1);
        const score =
          diffCleanupSemanticScore(equality1, edit) +
          diffCleanupSemanticScore(edit, equality2);
        // The >= encourages trailing rather than leading whitespace on edits.
        if (score >= bestScore) {
          bestScore = score;
          bestEquality1 = equality1;
          bestEdit = edit;
          bestEquality2 = equality2;
        }
      }

      if (diffs[pointer - 1][1] !== bestEquality1) {
        // We have an improvement, save it back to the diff.
        if (bestEquality1) {
          diffs[pointer - 1][1] = bestEquality1;
        } else {
          diffs.splice(pointer - 1, 1);
          pointer--;
        }
        diffs[pointer][1] = bestEdit;
        if (bestEquality2) {
          diffs[pointer + 1][1] = bestEquality2;
        } else {
          diffs.splice(pointer + 1, 1);
          pointer--;
        }
      }
    }
    pointer++;
  }
}

/**
 * Reorder and merge like edit sections.  Merge equalities.
 * Any edit section can move as long as it doesn't cross an equality.
 * @param {DmpDiff[]} diffs Array of diff tuples.
 */
export function diffCleanupMerge(diffs: DmpDiff[]) {
  // Add a dummy entry at the end.
  diffs.push(createDiff(DiffOperation.EQUAL, ''));
  let pointer = 0;
  let count_delete = 0;
  let count_insert = 0;
  let text_delete = '';
  let text_insert = '';
  let commonlength;
  while (pointer < diffs.length) {
    switch (diffs[pointer][0]) {
      case DiffOperation.INSERT:
        count_insert++;
        text_insert += diffs[pointer][1];
        pointer++;
        break;
      case DiffOperation.DELETE:
        count_delete++;
        text_delete += diffs[pointer][1];
        pointer++;
        break;
      case DiffOperation.EQUAL:
        // Upon reaching an equality, check for prior redundancies.
        if (count_delete + count_insert > 1) {
          if (count_delete !== 0 && count_insert !== 0) {
            // Factor out any common prefixes.
            commonlength = diffCommonPrefix(text_insert, text_delete);
            if (commonlength !== 0) {
              if (
                pointer - count_delete - count_insert > 0 &&
                diffs[pointer - count_delete - count_insert - 1][0] ===
                  DiffOperation.EQUAL
              ) {
                diffs[pointer - count_delete - count_insert - 1][1] +=
                  text_insert.substring(0, commonlength);
              } else {
                diffs.splice(
                  0,
                  0,
                  createDiff(
                    DiffOperation.EQUAL,
                    text_insert.substring(0, commonlength),
                  ),
                );
                pointer++;
              }
              text_insert = text_insert.substring(commonlength);
              text_delete = text_delete.substring(commonlength);
            }
            // Factor out any common suffixes.
            commonlength = diffCommonSuffix(text_insert, text_delete);
            if (commonlength !== 0) {
              diffs[pointer][1] =
                text_insert.substring(text_insert.length - commonlength) +
                diffs[pointer][1];
              text_insert = text_insert.substring(
                0,
                text_insert.length - commonlength,
              );
              text_delete = text_delete.substring(
                0,
                text_delete.length - commonlength,
              );
            }
          }
          // Delete the offending records and add the merged ones.
          pointer -= count_delete + count_insert;
          diffs.splice(pointer, count_delete + count_insert);
          if (text_delete.length) {
            diffs.splice(
              pointer,
              0,
              createDiff(DiffOperation.DELETE, text_delete),
            );
            pointer++;
          }
          if (text_insert.length) {
            diffs.splice(
              pointer,
              0,
              createDiff(DiffOperation.INSERT, text_insert),
            );
            pointer++;
          }
          pointer++;
        } else if (
          pointer !== 0 &&
          diffs[pointer - 1][0] === DiffOperation.EQUAL
        ) {
          // Merge this equality with the previous one.
          diffs[pointer - 1][1] += diffs[pointer][1];
          diffs.splice(pointer, 1);
        } else {
          pointer++;
        }
        count_insert = 0;
        count_delete = 0;
        text_delete = '';
        text_insert = '';
        break;
    }
  }
  if (diffs[diffs.length - 1][1] === '') {
    diffs.pop();
  } // Remove the dummy entry at the end.

  // Second pass: look for single edits surrounded on both sides by equalities
  // which can be shifted sideways to eliminate an equality.
  // e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
  let changes = false;
  pointer = 1;
  // Intentionally ignore the first and last element (don't need checking).
  while (pointer < diffs.length - 1) {
    if (
      diffs[pointer - 1][0] === DiffOperation.EQUAL &&
      diffs[pointer + 1][0] === DiffOperation.EQUAL
    ) {
      // This is a single edit surrounded by equalities.
      if (
        diffs[pointer][1].substring(
          diffs[pointer][1].length - diffs[pointer - 1][1].length,
        ) === diffs[pointer - 1][1]
      ) {
        // Shift the edit over the previous equality.
        diffs[pointer][1] =
          diffs[pointer - 1][1] +
          diffs[pointer][1].substring(
            0,
            diffs[pointer][1].length - diffs[pointer - 1][1].length,
          );
        diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
        diffs.splice(pointer - 1, 1);
        changes = true;
      } else if (
        diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) ===
        diffs[pointer + 1][1]
      ) {
        // Shift the edit over the next equality.
        diffs[pointer - 1][1] += diffs[pointer + 1][1];
        diffs[pointer][1] =
          diffs[pointer][1].substring(diffs[pointer + 1][1].length) +
          diffs[pointer + 1][1];
        diffs.splice(pointer + 1, 1);
        changes = true;
      }
    }
    pointer++;
  }
  // If shifts were made, the diff needs reordering and another shift sweep.
  if (changes) {
    diffCleanupMerge(diffs);
  }
}

/* SURROGATE PAIR HANDLING
 *  - Taken from dmsnell's fork of diff-match-patch in order to fix surrogate pairs being split while diffing
 */

function isHighSurrogate(char: string) {
  const codePoint = char.codePointAt(0)!;
  return codePoint >= 0xd800 && codePoint <= 0xdbff;
}

function isLowSurrogate(char: string) {
  const codePoint = char.codePointAt(0)!;
  return codePoint >= 0xdc00 && codePoint <= 0xdfff;
}

/**
 * Rearrange diff boundaries that split Unicode surrogate pairs.
 * @param {DmpDiff[]} diffs Array of diff tuples.
 */
export function diffCleanupSplitSurrogates(diffs: DmpDiff[]) {
  let lastEnd;

  for (let i = 0; i < diffs.length; i++) {
    const thisDiff = diffs[i];
    const thisTop = thisDiff[1][0];
    const thisEnd = thisDiff[1][thisDiff[1].length - 1];

    if (thisDiff[1].length === 0) {
      diffs.splice(i--, 1);
      continue;
    }

    if (thisEnd && isHighSurrogate(thisEnd)) {
      lastEnd = thisEnd;
      thisDiff[1] = thisDiff[1].slice(0, -1);
    }

    if (
      lastEnd &&
      thisTop &&
      isHighSurrogate(lastEnd) &&
      isLowSurrogate(thisTop)
    ) {
      thisDiff[1] = lastEnd + thisDiff[1];
    }

    if (thisDiff[1].length === 0) {
      diffs.splice(i--, 1);
      continue;
    }
  }

  return diffs;
}

/*
 * CODE POINT AND ARRAY INDEX HANDLING
 *  - Prevents issues with diffs that have a large number of unique lines and words
 */

const CODEPOINT_SKIP_MIN = 0xd800;
const CODEPOINT_SKIP_MAX = 0xdfff; // inclusive
const CODEPOINT_SKIP_RANGE = CODEPOINT_SKIP_MAX - CODEPOINT_SKIP_MIN + 1; // min and max are inclusive, so add 1

export function arrayIndexToValidCodePoint(arrayIndex: number): number {
  if (arrayIndex >= CODEPOINT_SKIP_MIN) {
    return arrayIndex + CODEPOINT_SKIP_RANGE;
  }
  return arrayIndex;
}

export function codePointToValidArrayIndex(codePoint: number): number {
  if (codePoint >= CODEPOINT_SKIP_MAX) {
    return codePoint - CODEPOINT_SKIP_RANGE;
  }
  return codePoint;
}
