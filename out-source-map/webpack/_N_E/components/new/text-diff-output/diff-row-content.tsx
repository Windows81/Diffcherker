import cx from 'classnames';
import { type Chunk, type SideData } from 'types/normalize';
import getChunkSearchId from 'lib/search/get-chunk-search-id';
import dynamic from 'next/dynamic';
import { type DiffInputType } from 'types/diff-input-type';
import { type DiffSide } from 'types/diffSide';

import DiffChunk from './diff-chunk';
import css from './diff-row-content.module.css';
import SearchHighlightChunk from './search-highlight-chunk';
import { HighlightChunk } from 'lib/search/diff-fuse-searcher';
import { RowMoveType } from 'types/moves';

const SyntaxHighlightChunk = dynamic(
  async () => await import('./syntax-highlight-chunk'),
  {
    ssr: false,
  },
);

interface DiffRowContentProps {
  side: DiffSide;
  content?: SideData;
  start?: boolean;
  end?: boolean;
  insideChanged?: boolean;
  syntaxHighlight?: string | null;
  rowIndex: number;
  isSelected?: boolean;
  diffInputType: DiffInputType;
  isUserSearching?: boolean;
  highlightChunks?: Record<string, HighlightChunk>;
  currSearchResultId?: string;
  moveState?: RowMoveType;
}

const DiffRowContent: React.FC<DiffRowContentProps> = ({
  side,
  content,
  start,
  end,
  insideChanged,
  syntaxHighlight,
  rowIndex,
  isUserSearching,
  highlightChunks,
  currSearchResultId,
  moveState,
}) => {
  const isLeft = side === 'left';
  const chunkType: Chunk['type'] = isLeft ? 'remove' : 'insert';
  const isEmpty = !content?.chunks || content.chunks.length === 0;
  const isInsideModified = !!insideChanged && !isEmpty;
  const isLineModified =
    isInsideModified ||
    (!isEmpty && content?.chunks?.every(({ type }) => type === chunkType));
  const isNewLine =
    !isEmpty && content?.chunks?.every(({ value }) => value === '');

  const classes = cx(css.content, {
    [css.removed]: isLeft && isLineModified,
    [css.inserted]: !isLeft && isLineModified,
    [css.start]: start,
    [css.end]: end,
    [css.empty]: isEmpty,
    [css.modified]: isInsideModified,
    [css.rowBeforeMove]: moveState === RowMoveType.RightBeforeMove,
    [css.moveStart]: moveState === RowMoveType.MoveStart,
    [css.moveMiddle]: moveState === RowMoveType.MoveMiddle,
    [css.moveEnd]: moveState === RowMoveType.MoveEnd,
  });

  return (
    <div className={classes}>
      {isNewLine ? (
        <br /> // this is here so that when you copy a side, the line breaks copy too
      ) : (
        content?.chunks.map((chunk, index) => {
          const key = `l${index}`;
          const chunkId = getChunkSearchId(side, rowIndex, index);
          const highlightChunk = highlightChunks?.[chunkId];

          const shouldSearchHighlight = isUserSearching && highlightChunk;
          if (shouldSearchHighlight) {
            return (
              <SearchHighlightChunk
                key={key}
                chunk={highlightChunk}
                isModified={isInsideModified}
                currSearchResultId={currSearchResultId}
              />
            );
          }

          const shouldSyntaxHighlight = !isUserSearching && syntaxHighlight; // don't syntax highlight when searching
          if (shouldSyntaxHighlight) {
            return (
              <SyntaxHighlightChunk
                key={key}
                chunk={chunk}
                syntaxHighlight={syntaxHighlight}
                isModified={isInsideModified}
              />
            );
          }

          return (
            <DiffChunk key={key} chunk={chunk} isModified={isInsideModified} />
          );
        })
      )}
    </div>
  );
};

export default DiffRowContent;
