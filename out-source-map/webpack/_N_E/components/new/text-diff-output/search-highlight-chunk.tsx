import cx from 'classnames';
import { type HighlightChunk } from 'lib/search/diff-fuse-searcher';

import DiffChunk from './diff-chunk';
import css from './search-highlight-chunk.module.css';

// Represents the metadata for text parts within a chunk
interface InnerChunkPart {
  value: string;
  isHighlighted?: boolean;
  id?: string;
}

interface SearchHighlightChunkProps {
  chunk: HighlightChunk;
  isModified: boolean;
  currSearchResultId?: string;
}

const SearchHighlightChunk: React.FC<SearchHighlightChunkProps> = ({
  chunk,
  isModified,
  currSearchResultId: propCurrSearchResultId,
}) => {
  const currSearchResultId = propCurrSearchResultId;

  // TODO maybe easier/faster to do things in perspective of chunk indices not row indices?
  //      This would require indexing chars at chunk text instead of row text

  // Accumulate inner chunk texts
  const innerChunkParts: InnerChunkPart[] = [];
  let charCountSoFar = 0;
  for (let i = 0; i < chunk.searchResults.length; i++) {
    const searchResult = chunk.searchResults[i];

    // Try prepending chars
    if (i === 0 && searchResult.start > chunk.start) {
      const beforeText = searchResult.sideText.substring(
        chunk.start,
        searchResult.start,
      );
      charCountSoFar += beforeText.length;
      innerChunkParts.push({ value: beforeText });
    }

    // Highlight search result text at specific indices (indices based on search result position relative to chunk)
    const highlightStart =
      searchResult.start >= chunk.start ? searchResult.start : chunk.start;
    const highlightEnd =
      searchResult.end <= chunk.end ? searchResult.end : chunk.end;
    const highlightText = searchResult.sideText.substring(
      highlightStart,
      highlightEnd + 1,
    );

    charCountSoFar += highlightText.length;
    innerChunkParts.push({
      value: highlightText,
      isHighlighted: true,
      id: searchResult.id,
    });

    // Try appending chars
    if (charCountSoFar < chunk.value.length) {
      const appendEnd =
        i < chunk.searchResults.length - 1
          ? chunk.searchResults[i + 1].start // next search result start index
          : chunk.end + 1;

      const afterText = searchResult.sideText.substring(
        chunk.start + charCountSoFar,
        appendEnd,
      );

      charCountSoFar += afterText.length;
      innerChunkParts.push({ value: afterText });
    }
  }

  return (
    <DiffChunk chunk={chunk} isModified={isModified}>
      {innerChunkParts.map(({ id, isHighlighted, value }, index) => (
        <span
          key={index}
          id={id} // TODO should adjust this (rn it's possible to have duplicate id tags, scroll might be buggy)
          className={cx({
            [css.highlighted]: isHighlighted,
            [css.currentResult]: currSearchResultId === id,
          })}
        >
          {value}
        </span>
      ))}
    </DiffChunk>
  );
};

export default SearchHighlightChunk;
