import React from 'react';

import { User } from 'types/user';
import css from './badge.module.css';

interface CommentBadgeProps {
  user: (Partial<User> & { email: string; name: string }) | User;
}

const CommentBadge: React.FC<CommentBadgeProps> = ({ user }) => {
  const longIdentifier = user.name ?? user.email;
  const parts = longIdentifier.split(' ');

  const firstInitial = parts[0] ? parts[0].charAt(0) : '';
  const lastInitial = parts[parts.length - 1]
    ? parts[parts.length - 1].charAt(0)
    : '';

  return (
    <div className={css.badge}>
      <div>{firstInitial + lastInitial}</div>
    </div>
  );
};

export default CommentBadge;
