import React, { useState } from 'react';

import { type Comment } from 'types/comment';

import css from './box.module.css';
import Badge from './badge';
import { intlFormat } from 'date-fns';
import Dropdown from 'components/shared/dropdown';
import EllipsisVerticalSvg from 'components/shared/icons/ellipsis-vertical.svg';
import { State, useAppDispatch, useAppSelector } from 'redux/store';
import * as DiffActions from 'redux/modules/diff-module';
import { getDiff } from 'redux/selectors/diff-selector';
import { User } from 'types/user';
import { t } from 'lib/react-tiny-i18n';
interface CommentBoxProps {
  comment: Comment;
  user?: User;
}

const CommentBox: React.FC<CommentBoxProps> = ({ comment, user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const slug = useAppSelector((state: State) => getDiff(state).slug);
  user = useAppSelector((state) => state.user.user) ?? user;
  return (
    <div className={css.commentBox}>
      <div className={css.header}>
        <div className={css.nameHeader}>
          <Badge user={comment.user} />
          <div className={css.name}>
            {comment.user.name ?? comment.user.email}
            <div className={css.createdAt}>
              {intlFormat(new Date(comment.createdAt), {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </div>
          </div>
        </div>
        {user?.email === comment.user.email && (
          <div className={css.contextMenu}>
            <Dropdown
              rightAlign
              display={EllipsisVerticalSvg}
              isOpen={isDropdownOpen}
              setIsOpen={setIsDropdownOpen}
              buttonOpenClassName={css.dropdownOpen}
              onChange={() => {
                dispatch(
                  DiffActions.deleteComment({
                    slug: slug ?? '',
                    comment,
                  }),
                );
              }}
              options={[
                {
                  label: t('SaveDiffModal.deleteDiff'),
                  value: 'deleteComment',
                  className: css.deleteButton,
                },
              ]}
            />
          </div>
        )}
      </div>
      <div className={css.contents}>
        <pre>{comment.contents}</pre>
      </div>
    </div>
  );
};

export default CommentBox;
