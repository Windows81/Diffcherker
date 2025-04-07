import { SideData } from 'types/normalize';
import { FC, useMemo } from 'react';
import { CommentThread } from 'types/comment-thread';
import cx from 'classnames';
import css from './diff-comment-button.module.css';
import CommentButton from 'components/comment/button';
import { CommentLocation } from 'types/comment';
import { useHotkeys } from 'lib/hooks/use-hotkeys';

type DiffCommentButtonProps = {
  commentThreads?: CommentThread[];
  side: 'left' | 'right';
  sideData?: SideData;
  expanded: boolean;
  classNames?: string;
  disableNewComment?: boolean;
  onCommentOpen?: (location: CommentLocation) => void;
  onCommentClose?: (location: CommentLocation) => void;
};

const DiffCommentButton: FC<DiffCommentButtonProps> = ({
  commentThreads = [],
  side,
  sideData,
  classNames,
  expanded,
  disableNewComment = false,
  onCommentOpen = () => {
    /* noop */
  },
  onCommentClose = () => {
    /* noop */
  },
}) => {
  const commentThread = useMemo(
    () =>
      commentThreads.find(
        (commentThread) =>
          commentThread.side === side &&
          commentThread.lineNumber === sideData?.line,
      ),
    [commentThreads, side, sideData?.line],
  );

  const hasData = sideData && !!sideData.chunks.length;
  const hasCommentThread = !!commentThread;

  const showCommentButton = hasData && (!disableNewComment || hasCommentThread);

  const hotkeyRef = useHotkeys<HTMLDivElement>('Escape', () => {
    onCommentClose({
      lineNumber: sideData?.line ?? -1,
      side,
    });
  });

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      ref={hotkeyRef}
      onClick={(e) => e.stopPropagation()}
      className={cx(
        'hide-print',
        css.diffCommentLine,
        commentThread && css.hasComments,
        expanded && css.expanded,
        classNames,
      )}
    >
      {showCommentButton && (
        <>
          {
            <CommentButton
              highlight={hasCommentThread}
              toggled={expanded}
              className={css.commentButton}
              onClick={() => {
                const commentLocation = {
                  lineNumber: sideData.line ?? -1,
                  side,
                };
                if (!expanded) {
                  onCommentOpen(commentLocation);
                } else {
                  onCommentClose({
                    lineNumber: sideData.line ?? -1,
                    side,
                  });
                }
              }}
            />
          }
        </>
      )}
    </div>
  );
};

export default DiffCommentButton;
