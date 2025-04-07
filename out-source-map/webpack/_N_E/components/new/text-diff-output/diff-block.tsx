/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import { DiffBlock as DiffBlockInterface } from 'types/normalize';
import { useCallback, useContext, useRef } from 'react';
import { DiffInputType } from 'types/diff-input-type';
import { HighlightChunk } from 'lib/search/diff-fuse-searcher';
import Button from 'components/shared/button';
import MergeBlockControl from './merge-block-control';
import cx from 'classnames';
import ExpandSvg from 'components/shared/icons/expand.svg';
import css from './diff-block.module.css';
import NavigationBlockControl from './navigation-block-control';

import ExplainContext, { ExplainProvider } from 'components/explain/context';
import ExplainBlockControl from './explain-block-control';

import ExplainBlockPane from './explain-block-pane';
import getCompressedRangeFor, {
  CompressedRange,
  CompressedRangeOptions,
} from 'lib/get-compressed-range-for';
import DiffRow from './diff-row';
import { CommentLocation } from 'types/comment';
import { Diff } from 'types/diff';
import TextDiffOutputContext, { nullExplainItem } from './context';
import { CommentThread } from 'types/comment-thread';
import { RowMoveType } from 'types/moves';

export type DiffBlockProps = {
  parentId?: string;
  index: number;
  block: DiffBlockInterface;
  diff: Diff;
  isExporting?: boolean;
  shouldCollapseLines?: boolean;
  isUnified?: boolean;
  isExpanded?: boolean;
  syntaxHighlight?: string | null;
  diffInputType: DiffInputType;
  isSelected?: boolean;
  lineNumberWidth?: number;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onExpandDiffblock?: (block: DiffBlockInterface) => void;
  onCommentOpen?: (location: CommentLocation) => void;
  onCommentClose?: (location: CommentLocation) => void;
  commentThreads?: CommentThread[];
  openCommentLocations?: CommentLocation[];
  allowMerging?: boolean;
  allowComments?: boolean;
  allowCodeMoves?: boolean;
  isUserSearching?: boolean;
  highlightChunks?: Record<string, HighlightChunk>;
  currSearchResultId?: string;
  moveStates?: {
    left: RowMoveType[];
    right: RowMoveType[];
  };
  compressOptions?: CompressedRangeOptions;
};

const DiffBlock: React.FC<DiffBlockProps> = ({
  index,
  diff,
  block,
  isExporting,
  shouldCollapseLines,
  parentId,
  isUnified,
  isExpanded,
  syntaxHighlight,
  diffInputType,
  lineNumberWidth,
  onExpandDiffblock = () => {
    /* noop */
  },
  onCommentOpen = () => {
    /* noop */
  },
  onCommentClose = () => {
    /* noop */
  },
  commentThreads,
  openCommentLocations,
  allowMerging,
  allowComments,
  isUserSearching,
  highlightChunks,
  currSearchResultId,
  moveStates,
  compressOptions,
}) => {
  const rows = diff.rows ?? [];
  const diffBlocks = diff.blocks ?? [];

  const { selectedBlock, api } = useContext(TextDiffOutputContext);

  const compressedRangeRef = useRef<CompressedRange | undefined>();

  const blockRows = rows.slice(block.lineStart, block.lineEnd + 1);
  const isBlockSelected = !isExporting && selectedBlock === block;
  const isEqualBlock =
    block.type.left === 'equal' && block.type.right === 'equal';

  const isWeb = !process.env.NEXT_PUBLIC_IS_ELECTRON;
  const showExplain = isWeb;

  if (isEqualBlock) {
    compressedRangeRef.current = getCompressedRangeFor(
      index,
      diffBlocks,
      compressOptions,
    );
  } else {
    compressedRangeRef.current;
  }

  const compressedRange = compressedRangeRef.current;
  const explainBlockItem = api.getExplainBlockItemFor(block);

  const onReset = useCallback(() => {
    api.setExplainBlockItemFor(block, nullExplainItem);
  }, [api, block]);

  const onComplete = useCallback(
    (explanation: string) =>
      api.setExplainBlockItemFor(block, {
        ...explainBlockItem,
        explanation,
      }),
    [api, block, explainBlockItem],
  );

  return (
    <ExplainProvider
      url="/ai/explain"
      contextKey={block}
      defaultExplanation={explainBlockItem.explanation}
      showErrorAsExplanation={true}
      onComplete={onComplete}
      onReset={onReset}
    >
      <ExplainContext.Consumer>
        {({ hasExplanation, isExplaining }) => {
          const explainOpen = hasExplanation || isExplaining;
          return (
            <div
              className={cx(
                allowMerging &&
                  (isBlockSelected ? css.shadowBlock : css.unselectedBlock),
                css.diffBlock,
                !isEqualBlock && css.unequalBlock,
              )}
            >
              {isBlockSelected && (
                <div
                  className={css.navigationControlContainer}
                  onClick={(e) => e.stopPropagation()}
                >
                  <NavigationBlockControl />
                  {showExplain ? (
                    <ExplainBlockControl blockIndex={index} />
                  ) : (
                    <div></div>
                  )}
                </div>
              )}
              <div
                className={cx(
                  isBlockSelected && css.selectedBlock,
                  isBlockSelected && 'diff-selected-block',
                )} // static class used for code move scroll to.
                onClick={() =>
                  allowMerging && !isEqualBlock && api.selectBlock(index)
                }
              >
                <div
                  className={cx(css.diffRows, explainOpen && css.explainOpen)}
                >
                  {blockRows.map((row, index) => {
                    const rowIndex = block.lineStart + index;
                    const isInCompressedRange =
                      compressedRange &&
                      compressedRange.rangeStart <= index &&
                      compressedRange.rangeEnd >= index;
                    if (
                      isExpanded ||
                      !isInCompressedRange ||
                      !shouldCollapseLines
                    ) {
                      return (
                        <DiffRow
                          key={index}
                          parentId={parentId}
                          isUnified={isUnified}
                          syntaxHighlight={syntaxHighlight}
                          row={row}
                          index={rowIndex}
                          diffInputType={diffInputType}
                          lineNumberWidth={lineNumberWidth}
                          isUserSearching={isUserSearching}
                          highlightChunks={highlightChunks}
                          currSearchResultId={currSearchResultId}
                          onCommentOpen={onCommentOpen}
                          onCommentClose={onCommentClose}
                          isSelected={false}
                          commentThreads={commentThreads}
                          openCommentLocations={openCommentLocations}
                          allowComments={allowComments}
                          moves={diff.moves}
                          moveState={{
                            left: moveStates?.left[row.left.line ?? -1],
                            right: moveStates?.right[row.right.line ?? -1],
                          }}
                        />
                      );
                    } else if (compressedRange.rangeStart === index) {
                      return (
                        <div key={index} className={css.expandSection}>
                          <Button
                            onClick={(e: React.MouseEvent<HTMLElement>) => {
                              e.stopPropagation();
                              onExpandDiffblock(block);
                            }}
                            style="secondary"
                            tone="base"
                            iconStartSvg={ExpandSvg}
                            iconEndSvg={ExpandSvg}
                            fullWidth
                          >
                            {compressedRange.rangeEnd -
                              compressedRange.rangeStart +
                              1}{' '}
                            collapsed lines
                          </Button>
                        </div>
                      );
                    } else {
                      return null;
                    }
                  })}
                  {isBlockSelected && (
                    <div
                      className={cx(css.mergeControlContainer)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={cx(explainOpen && css.explainOpen)}>
                        <MergeBlockControl />
                      </div>
                    </div>
                  )}
                </div>
                {isBlockSelected && explainOpen && (
                  <div className={css.explainContainer}>
                    <ExplainBlockPane />
                  </div>
                )}
              </div>
            </div>
          );
        }}
      </ExplainContext.Consumer>
    </ExplainProvider>
  );
};

export default DiffBlock;
