import cx from 'classnames';
import { type UnifiedRow, type Meta as Row } from 'types/normalize';
import { getDiffLineId } from './commands/scroll-to';
import { type DiffInputType } from 'types/diff-input-type';

import DiffRowContent from './diff-row-content';
import css from './diff-row.module.css';
import MergeControl from './merge-block-control';
import { HighlightChunk } from 'lib/search/diff-fuse-searcher';
import { type CommentThread } from 'types/comment-thread';
import DiffCommentButton from './diff-comment-button';
import { default as CommentThreadComponent } from 'components/comment/thread';
import { useMemo } from 'react';
import { CommentLocation } from 'types/comment';
import { DiffSide } from 'types/diffSide';
import DiffMoves from './diff-moves';
import { Moves, RowMoveType } from 'types/moves';

const createNewCommentThread = (side: DiffSide, lineNumber: number) => {
  return {
    side,
    lineNumber,
    commentCount: 0,
    loadedComments: [],
    areAllCommentsLoaded: true,
  };
};

const findClosestLine = (target: EventTarget) => {
  let currentTarget: HTMLElement | null = target as HTMLElement;
  while (
    currentTarget &&
    (!currentTarget.classList ||
      !currentTarget.classList.contains('diff-line-side'))
  ) {
    currentTarget = currentTarget.parentNode as HTMLElement | null;
  }
  return currentTarget;
};

const setSelectionSide = (
  event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  parentId: string,
) => {
  if (!event.target) {
    return;
  }

  const closestLine = findClosestLine(event.target);
  const resultContainer = document.getElementById(parentId);

  if (!closestLine || !resultContainer) {
    return;
  }

  if (closestLine.classList.contains('side-left')) {
    resultContainer.classList.add(css.selectLeft);
    resultContainer.classList.remove(css.selectRight);
  } else if (closestLine.classList.contains('side-right')) {
    resultContainer.classList.add(css.selectRight);
    resultContainer.classList.remove(css.selectLeft);
  }
};

export interface DiffRowProps {
  parentId?: string;
  isUnified?: boolean;
  syntaxHighlight?: string | null;
  row: Row | UnifiedRow;
  index: number;
  diffInputType: DiffInputType;
  isSelected: boolean;
  moves?: Moves;
  lineNumberWidth?: number;
  setSelectionSide?: React.MouseEventHandler<HTMLDivElement>;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onCommentOpen?: (location: CommentLocation) => void;
  onCommentClose?: (location: CommentLocation) => void;
  allowMerging?: boolean;
  allowComments?: boolean;
  isUserSearching?: boolean;
  highlightChunks?: Record<string, HighlightChunk>;
  currSearchResultId?: string;
  showComments?: boolean;
  commentThreads?: CommentThread[];
  openCommentLocations?: CommentLocation[];
  moveState?: {
    left?: RowMoveType;
    right?: RowMoveType;
  };
}

const DiffRow: React.FC<DiffRowProps> = ({
  parentId = '',
  isUnified,
  syntaxHighlight,
  row,
  index,
  diffInputType,
  isSelected,
  lineNumberWidth = 12,
  onClick,
  onCommentOpen = () => {
    /* noop */
  },
  onCommentClose = () => {
    /* noop */
  },
  allowComments,
  isUserSearching,
  highlightChunks,
  currSearchResultId,
  showComments,
  commentThreads,
  openCommentLocations,
  moves,
  moveState,
}) => {
  const { left, right, start, end, insideChanged } = row;
  const contentProps = {
    start,
    end,
    insideChanged,
    syntaxHighlight,
    rowIndex: index,
    diffInputType,
    isSelected,
    isUserSearching,
    highlightChunks,
    currSearchResultId,
  };

  let startOfBlock = false;
  if (start) {
    startOfBlock = !isUnified || !('blockStart' in row) || !!row.blockStart;
  }

  let endOfBlock = false;
  if (end) {
    endOfBlock = !isUnified || !('blockEnd' in row) || !!row.blockEnd;
  }

  const leftCommentThread = useMemo(() => {
    const threads = commentThreads ?? [];
    const locations = openCommentLocations ?? [];
    const lineNumber = left?.line ?? -1;
    const side = 'left';

    const foundThread = threads.find(
      (thread) => thread.side === side && thread.lineNumber === lineNumber,
    );

    const isOpen = locations.some(
      (location) =>
        location.side === side && location.lineNumber === lineNumber,
    );

    return (
      foundThread ??
      (isOpen ? createNewCommentThread(side, lineNumber) : undefined)
    );
  }, [commentThreads, left?.line, openCommentLocations]);

  const rightCommentThread = useMemo(() => {
    const threads = commentThreads ?? [];
    const locations = openCommentLocations ?? [];
    const lineNumber = right?.line ?? -1;
    const side = 'right';

    const foundThread = threads.find(
      (thread) => thread.side === side && thread.lineNumber === lineNumber,
    );

    const isOpen = locations.some(
      (location) =>
        location.side === side && location.lineNumber === lineNumber,
    );

    return (
      foundThread ??
      (isOpen ? createNewCommentThread(side, lineNumber) : undefined)
    );
  }, [commentThreads, right?.line, openCommentLocations]);

  const isLeftThreadOpen = useMemo(
    () =>
      !!(openCommentLocations ?? []).find(
        (openCommentLocation) =>
          openCommentLocation.side === 'left' &&
          openCommentLocation.lineNumber === left?.line,
      ),
    [left?.line, openCommentLocations],
  );

  const isRightThreadOpen = useMemo(
    () =>
      !!(openCommentLocations ?? []).find(
        (openCommentLocation) =>
          openCommentLocation.side === 'right' &&
          openCommentLocation.lineNumber === right?.line,
      ),
    [right?.line, openCommentLocations],
  );

  const hasThreadOpen =
    (isLeftThreadOpen && leftCommentThread) ||
    (isRightThreadOpen && rightCommentThread);

  const threadForUnified = leftCommentThread || rightCommentThread;
  const hasComments = !!(commentThreads?.length && commentThreads?.length > 0);

  const lineTypeIsEqual =
    left?.chunks?.every(({ type }) => type === 'equal') &&
    right?.chunks?.every(({ type }) => type === 'equal');

  const unifiedSideData = left?.line === 0 ? right : left || right;
  const unifiedSide = left?.line === 0 ? 'right' : 'left';

  // -1 returns a undefined value
  const deletionMovedTo = moves?.deletionToInsertionMap[left.line ?? -1];
  const insertionMovedTo = moves?.insertionToDeletionMap[right.line ?? -1];
  const hasMovedTo = deletionMovedTo || insertionMovedTo;

  return (
    <>
      {/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        id={getDiffLineId(index, parentId)}
        className={cx(
          css.wrapper,
          {
            [css.blockEnd]: !isSelected && end && endOfBlock,
            [css.pointer]: onClick && !isSelected,
          },
          hasThreadOpen && css.hasThreadOpen,
        )}
        onMouseDown={(event) => setSelectionSide(event, parentId)}
        onClick={isSelected ? undefined : onClick}
      >
        <div
          className={cx(css.container, isUnified ? css.unified : css.split, {
            [css.selected]: isSelected,
            [css.start]: start && startOfBlock,
            [css.end]: !isSelected && end && endOfBlock,
            [css.selectedEnd]: isSelected && end && endOfBlock,
            [css.commentsShowing]: showComments,
          })}
        >
          {!isUnified && hasMovedTo && (
            <DiffMoves
              paddingSize={lineNumberWidth + 8 + (allowComments ? 28 : 0)}
              deletionMovedTo={deletionMovedTo}
              insertionMovedTo={insertionMovedTo}
            />
          )}
          <div className={cx(css.row)}>
            {isUnified ? (
              <div className={cx(css.side, css.innerContent)}>
                <div className={css.sideInner}>
                  {(allowComments || hasComments) && (
                    <DiffCommentButton
                      classNames={css.commentButton}
                      sideData={unifiedSideData}
                      side={unifiedSide}
                      commentThreads={commentThreads}
                      expanded={!!hasThreadOpen}
                      onCommentOpen={onCommentOpen}
                      onCommentClose={onCommentClose}
                      disableNewComment={!allowComments}
                    />
                  )}
                  <LineNumber
                    line={left?.line}
                    lineNumberWidth={lineNumberWidth}
                  />
                  <LineNumber
                    line={right?.line}
                    lineNumberWidth={lineNumberWidth}
                  />
                  <DiffRowContent
                    side={unifiedSide}
                    content={unifiedSideData}
                    {...contentProps}
                  />
                </div>

                {threadForUnified && (
                  <CommentThreadComponent
                    commentThread={threadForUnified}
                    isOpen={!!hasThreadOpen}
                    lineNumberWidth={lineNumberWidth * 2 + 8}
                    hideCommentButton={!allowComments}
                    onCommentClose={onCommentClose}
                  />
                )}
              </div>
            ) : (
              <>
                <div
                  className={cx(
                    'diff-line-side',
                    'side-left',
                    css.innerContent,
                    css.side,
                  )}
                >
                  <div className={css.sideInner}>
                    {(allowComments || hasComments) && (
                      <DiffCommentButton
                        classNames={css.commentButton}
                        sideData={left}
                        side="left"
                        commentThreads={commentThreads}
                        expanded={isLeftThreadOpen}
                        onCommentOpen={onCommentOpen}
                        onCommentClose={onCommentClose}
                        disableNewComment={!allowComments}
                      />
                    )}
                    <LineNumber
                      line={left?.line}
                      lineNumberWidth={lineNumberWidth}
                    />
                    <DiffRowContent
                      moveState={moveState?.left}
                      side="left"
                      content={left}
                      {...contentProps}
                    />
                  </div>

                  {leftCommentThread && (
                    <CommentThreadComponent
                      isOpen={isLeftThreadOpen}
                      lineNumberWidth={lineNumberWidth}
                      commentThread={leftCommentThread}
                      hideCommentButton={!allowComments}
                      onCommentClose={onCommentClose}
                    />
                  )}
                </div>
                <div
                  className={cx(
                    'diff-line-side',
                    'side-right',
                    css.innerContent,
                    css.side,
                  )}
                >
                  <div className={css.sideInner}>
                    {(allowComments || hasComments) && (
                      <DiffCommentButton
                        classNames={css.commentButton}
                        sideData={lineTypeIsEqual ? left : right}
                        side={lineTypeIsEqual ? 'left' : 'right'}
                        commentThreads={commentThreads}
                        expanded={
                          lineTypeIsEqual ? isLeftThreadOpen : isRightThreadOpen
                        }
                        onCommentOpen={onCommentOpen}
                        onCommentClose={onCommentClose}
                        disableNewComment={!allowComments}
                      />
                    )}
                    <LineNumber
                      line={right?.line}
                      lineNumberWidth={lineNumberWidth}
                    />
                    <DiffRowContent
                      side="right"
                      content={right}
                      moveState={moveState?.right}
                      {...contentProps}
                    />
                  </div>
                  {rightCommentThread && (
                    <CommentThreadComponent
                      isOpen={isRightThreadOpen}
                      lineNumberWidth={lineNumberWidth}
                      commentThread={rightCommentThread}
                      hideCommentButton={!allowComments}
                      onCommentClose={onCommentClose}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {isSelected && end && endOfBlock && (
        <div className={cx(css.wrapper, css.blockEnd, 'no-select')}>
          <div className={cx(css.container, css.selected, css.end, css.merge)}>
            <MergeControl />
          </div>
        </div>
      )}
    </>
  );
};

interface LineNumberProps {
  line?: number;
  lineNumberWidth: number;
}

const LineNumber: React.FC<LineNumberProps> = ({ line, lineNumberWidth }) => {
  const lineNumber = line && line > 0 ? line.toString() : '';
  return (
    <div
      className={css.lineNumber}
      data-content={lineNumber}
      style={{ width: lineNumberWidth }}
    />
  );
};

export default DiffRow;
