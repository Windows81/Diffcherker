import React, { useCallback, useRef, useState } from 'react';
import CommentBox from './box';
import css from './thread.module.css';
import TextArea from 'components/shared/form/text-area';
import { User } from 'types/user';
import CommentBadge from './badge';
import { type CommentThread as CommentThreadType } from 'types/comment-thread';
import pluralize from 'pluralize';
import Button from 'components/shared/button';
import { State, useAppDispatch, useAppSelector } from 'redux/store';
import EllipsisHorizontalSvg from 'components/shared/icons/ellipsis-horizontal.svg';
import CommentSvg from 'components/shared/icons/comment.svg';
import * as DiffActions from 'redux/modules/diff-module';
import { getDiff } from 'redux/selectors/diff-selector';
import { CommentLocation } from 'types/comment';
import { t } from 'lib/react-tiny-i18n';

interface CommentThreadProps {
  commentThread: CommentThreadType;
  user?: User;
  lineNumberWidth?: number;
  isOpen?: boolean;
  hideCommentButton?: boolean;
  onCommentClose?: (commentLocation: CommentLocation) => void;
}

const CommentThread: React.FC<CommentThreadProps> = ({
  commentThread,
  user,
  lineNumberWidth = 0,
  isOpen = true,
  hideCommentButton = false,
  onCommentClose = () => {
    /* noop */
  },
}) => {
  const [comment, setComment] = useState<string>();
  const [toAddComment, setToAddComment] = useState<boolean>(
    !commentThread.commentCount,
  );
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  user = useAppSelector((state) => state.user.user) ?? user;
  const slug = useAppSelector((state: State) => getDiff(state).slug);

  const dispatch = useAppDispatch();

  const commentSubmit = useCallback(
    async (contents: string | undefined, commentThread: CommentThreadType) => {
      if (slug && contents) {
        await dispatch(
          DiffActions.createComment({
            slug,
            lineNumber: commentThread.lineNumber,
            side: commentThread.side,
            contents,
          }),
        ).unwrap();
      }

      setComment('');
    },
    [dispatch, slug],
  );

  const firstComment = commentThread.loadedComments[0];
  const remainingComments = commentThread.loadedComments.slice(1);

  return (
    isOpen && (
      <div style={{ marginLeft: lineNumberWidth + 36 }}>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div
          className={css.commentThread}
          onClick={(ev) => ev.stopPropagation()}
        >
          <div>
            {firstComment && <CommentBox comment={firstComment} />}
            {!commentThread.areAllCommentsLoaded && (
              <div className={css.showMoreComments}>
                <Button
                  style="primary"
                  tone="light-yellow"
                  fullWidth
                  iconStartSvg={EllipsisHorizontalSvg}
                  onClick={() => {
                    if (slug) {
                      dispatch(
                        DiffActions.loadCommentsForThread({
                          slug,
                          lineNumber: commentThread.lineNumber,
                          side: commentThread.side,
                        }),
                      );
                    }
                  }}
                >
                  Show {commentThread.commentCount - 2}{' '}
                  {pluralize('comment', commentThread.commentCount - 2)}
                </Button>
              </div>
            )}
            {remainingComments.map((comment) => (
              <CommentBox key={comment.id} comment={comment} />
            ))}
          </div>

          {toAddComment ? (
            <div className={css.commentInputBox}>
              <div className={css.badge}>
                {user && (
                  <CommentBadge
                    user={
                      user as Partial<User> & { email: string; name: string }
                    }
                  />
                )}
              </div>
              <div className={css.textAreaContainer}>
                <TextArea
                  value={comment}
                  placeholder={t('TextDiff.addCommentPlaceholder')}
                  ref={textAreaRef}
                  autoGrow={true}
                  autoGrowMax={120}
                  onChange={(event) => {
                    setComment(event.target.value);
                  }}
                />
                <div className={css.buttons}>
                  <Button
                    style="primary"
                    tone="green"
                    onClick={() => commentSubmit(comment, commentThread)}
                  >
                    {t('TextDiff.comment')}
                  </Button>
                  <Button
                    style="secondary"
                    tone="base"
                    onClick={() => {
                      setToAddComment(false);
                      if (commentThread.commentCount === 0) {
                        onCommentClose({
                          side: commentThread.side,
                          lineNumber: commentThread.lineNumber,
                        });
                      }
                    }}
                  >
                    {t('Diff.cancel')}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className={css.addCommentContainer}>
              {!hideCommentButton && (
                <Button
                  style="secondary"
                  tone="base"
                  iconStartSvg={CommentSvg}
                  onClick={() => setToAddComment(true)}
                >
                  {t('TextDiff.addCommentButtonLabel')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default CommentThread;
