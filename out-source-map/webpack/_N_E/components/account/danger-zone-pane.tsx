import Button from 'components/shared/button';

import css from './danger-zone-pane.module.css';

interface AccountDangerZonePaneProps {
  onDeleteAccount?: () => void;
}

export const AccountDangerZonePane: React.FC<AccountDangerZonePaneProps> = ({
  onDeleteAccount,
}) => {
  return (
    <div className={css.accountDangerZonePane}>
      <h2 className={css.accountDangerZonePaneHeader}>Danger Zone</h2>
      <p className={css.accountDangerZoneInfo}>
        Deleting your account will delete all your diffs. This action cannot be
        undone.
      </p>
      <div>
        <Button style="secondary" tone="red" onClick={onDeleteAccount}>
          Delete account
        </Button>
      </div>
    </div>
  );
};
