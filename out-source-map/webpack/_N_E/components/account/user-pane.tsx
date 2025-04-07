import Button from 'components/shared/button';
import Divider from 'components/shared/divider';
import type { User } from 'types/user';

import { AccountUserPaneEntry } from './user-pane-entry';
import css from './user-pane.module.css';
import { useAppSelector } from 'redux/store';
import { hasOwnSubscriptions } from 'redux/selectors/user-selector';

interface AccountUserPaneProps {
  user: User;
  onChangeEmail?: () => void;
  onSetTaxId?: () => void;
  onSignOut?: () => void;
}

export const AccountUserPane: React.FC<AccountUserPaneProps> = ({
  user,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onChangeEmail = () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onSetTaxId = () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onSignOut = () => {},
}) => {
  const hasSubscriptions = useAppSelector(hasOwnSubscriptions);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names.at(0)?.at(0)}${names.at(-1)?.at(0)}`;
    } else if (names.length === 1) {
      return `${names.at(0)?.at(0)}`;
    } else {
      return '??';
    }
  };

  return (
    <div className={css.accountUserPane}>
      <div className={css.header}>
        {user.name ? (
          <>
            <div className={css.headerName}>
              <div className={css.avatar}>{getInitials(user.name)}</div>
              <h2 className={css.header}>{user.name}</h2>
            </div>
            <div>
              <Button style="text" tone="base" onClick={onSignOut}>
                Sign out
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className={css.headerName}>
              <h2 className={css.header}>{user.email}</h2>
            </div>
            <div>
              <Button style="text" tone="base" onClick={onSignOut}>
                Sign out
              </Button>
            </div>
          </>
        )}
      </div>
      <Divider />

      {user.name && <AccountUserPaneEntry label="Name" value={user.name} />}
      <AccountUserPaneEntry
        label="Email"
        value={user.email}
        cta="Change Email"
        onCta={onChangeEmail}
      />
      {hasSubscriptions && (
        <AccountUserPaneEntry
          label="Tax ID"
          value={user.taxId}
          cta="Set Tax ID"
          onCta={onSetTaxId}
        />
      )}
    </div>
  );
};
