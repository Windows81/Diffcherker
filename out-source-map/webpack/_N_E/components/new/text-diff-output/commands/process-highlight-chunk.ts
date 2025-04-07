import {
  DiffSearchResult,
  HighlightChunk,
} from 'lib/search/diff-fuse-searcher';

export type HighlightChunks = Record<string, HighlightChunk>;

export const processHighlightChunks = (searchResults: DiffSearchResult[]) => {
  const result = searchResults.reduce<HighlightChunks>(
    (result, searchResult) => {
      for (const chunk of searchResult.chunks) {
        const isSearchResultInsideChunk =
          chunk.end >= searchResult.start && chunk.start <= searchResult.end;

        if (isSearchResultInsideChunk) {
          if (!result[chunk.id]) {
            result[chunk.id] = {
              ...chunk,
              searchResults: [],
            };
          }

          // TODO we don't copy entire search result cause that's copying a lot of data??? (or since we're pushing refs its actually fine)
          result[chunk.id].searchResults.push({
            sideText: searchResult.sideText,
            start: searchResult.start,
            end: searchResult.end,
            id: searchResult.id,
          });
        }
      }

      return result;
    },
    {},
  );
  return result;
};
