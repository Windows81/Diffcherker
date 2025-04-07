import Button from 'components/shared/button';

import css from './user-pane-entry.module.css';

interface AccountUserPaneEntryProps {
  label: string;
  value: string;
  cta?: string;
  onCta?: () => void;
}

export const AccountUserPaneEntry: React.FC<AccountUserPaneEntryProps> = ({
  label,
  value,
  cta,
  onCta,
}) => {
  return (
    <div className={css.entry}>
      <div className={css.entryValue}>
        <label className="section-title">{label}</label>
        {value ? (
          <div>{value}</div>
        ) : (
          <div className="fadded-text">Unknown</div>
        )}
      </div>
      {cta && (
        <div className={css.entryAction}>
          <Button style="secondary" tone="base" onClick={onCta}>
            {cta}
          </Button>
        </div>
      )}
    </div>
  );
};
