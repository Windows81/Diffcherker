import Fuse from 'fuse.js';
import { type DiffType } from 'redux/modules/user-module';
import { type DiffSide } from 'types/diffSide';

import { type Chunk, type Meta as Row, type UnifiedRow } from 'types/normalize';
import getChunkSearchId from './get-chunk-search-id';
import getDiffSearchResultId from './get-diff-search-result-id';

interface DiffFuseDoc {
  rowIndex: number;
  side: DiffSide;
  sideText: string;
  chunks: SearchChunk[];
}

export interface DiffSearchResult extends DiffFuseDoc {
  id: string;
  start: number; // char index in respect to the parent row text
  end: number;
  matchIndex: number; // specifies match within side text (since a single side can contain multiple matches)
}

// Has additional metadata needed for search highlighting
// TODO we can prob collect some of this metadata in normalize.ts
export interface SearchChunk extends Chunk {
  start: number; // char index in respect to the parent row text
  end: number;
  id: string;
  index: number;
}

export interface HighlightChunk extends SearchChunk {
  // This prop refers to only those results contained inside chunk.
  // We use Pick<> here b/c we only need certain metadata
  searchResults: Array<
    Pick<DiffSearchResult, 'sideText' | 'start' | 'end' | 'id'>
  >;
}

const FUSE_OPTIONS = {
  shouldSort: false,
  includeMatches: true,
  threshold: 0,
  ignoreLocation: true,
  useExtendedSearch: true,
  keys: ['sideText'],
};

const generateNewFuseInstance = () => {
  return new Fuse<DiffFuseDoc>([], FUSE_OPTIONS);
};

// TODO maybe make into a hook...
// Singleton that holds fuse.js search map and related operations
const DiffFuseSearcher = (function () {
  let _fuse: Fuse<DiffFuseDoc> = generateNewFuseInstance();

  // Pipe operator | breaks searches (e.g. "|" is interpreted as " OR ").
  // To fix this, we could set useExtendedSearch to false and try parsing through fuse results differently (skip matches that have range length < search text length)
  // However this could increase overhead significantly.
  const search = (searchText: string): DiffSearchResult[] => {
    if (_fuse === undefined) {
      console.error(`Tried searching when fuse instance doesn't exist`);
      return [];
    }

    const results =
      searchText.length > 0
        ? _fuse.search(`'"${searchText}"`) // we prepend ' to find exact match: https://fusejs.io/examples.html#extended-search
        : [];

    // format results (we want to identify each match found in a single chunk)
    // TODO We could avoid doing this if search index state keeps track of result index + match index.
    //      Doing it the current way is much easier to reason about however.
    const formattedResults = results.reduce<DiffSearchResult[]>(
      (result, fuseResult) => {
        if (!fuseResult.matches || fuseResult.matches.length <= 0) {
          return result;
        }

        const matchCharIndexRanges = fuseResult.matches[0].indices;
        for (let i = 0; i < matchCharIndexRanges.length; i++) {
          const [start, end] = matchCharIndexRanges[i];

          result.push({
            ...fuseResult.item,
            id: getDiffSearchResultId(
              fuseResult.item.side,
              fuseResult.item.rowIndex,
              i,
            ),
            start,
            end,
            matchIndex: i,
          });
        }
        return result;
      },
      [],
    );
    return formattedResults;
  };

  // TODO we can use web workers here
  const buildSearchMap = (rows: Row[] | UnifiedRow[], diffType: DiffType) => {
    _fuse = generateNewFuseInstance(); // reset search map

    if (!rows || rows.length <= 0) {
      return;
    }

    // TODO this processing can occur in DiffMerge (we're being kinda redundant,
    //      there are multiple places where we iterate through rows to build sth)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Diff is split; add both sides
      if (diffType === 'split') {
        _fuse.add(_createDiffFuseDoc(row as Row, 'left', i));
        _fuse.add(_createDiffFuseDoc(row as Row, 'right', i));
        continue;
      }

      // Diff is unified; only add one side
      if (row.left) {
        _fuse.add(_createDiffFuseDoc(row as Row, 'left', i));
        continue;
      }
      if (row.right) {
        _fuse.add(_createDiffFuseDoc(row as Row, 'right', i));
      }
    }
  };

  const _createDiffFuseDoc = (
    row: Row,
    side: DiffSide,
    rowIndex: number,
  ): DiffFuseDoc => {
    const sideData = row[side];
    const sideText = sideData.chunks.reduce(
      (acc, curr) => acc + curr.value,
      '',
    );
    const chunks: SearchChunk[] = [];

    let start = 0;
    for (let j = 0; j < sideData.chunks.length; j++) {
      const chunk = sideData.chunks[j];

      chunks.push({
        ...chunk,
        start,
        end: start + chunk.value.length - 1,
        id: getChunkSearchId(side, rowIndex, j),
        index: j,
      });
      start += chunk.value.length;
    }

    return {
      rowIndex,
      side,
      sideText,
      chunks,
    };
  };

  return {
    search,
    buildSearchMap,
  };
})();

export default DiffFuseSearcher;
