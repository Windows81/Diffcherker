import type { User } from 'types/user';

import css from './avatar.module.css';

interface AvatarProps {
  user?: User;
}

const Avatar: React.FC<AvatarProps> = ({ user }) => {
  return (
    <div className={css.avatar}>
      {!!user?.photoUrl ? (
        /* eslint-disable-next-line jsx-a11y/alt-text */
        <img src={user.photoUrl} />
      ) : (
        user?.name?.[0] || user?.email?.[0]
      )}
    </div>
  );
};

export default Avatar;
