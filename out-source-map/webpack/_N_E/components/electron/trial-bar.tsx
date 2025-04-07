import cx from 'classnames';
import Button from 'components/shared/button';
import PlanBadge from 'components/new/plan-badge';
import pluralize from 'pluralize';
import { differenceInDays, parseISO } from 'date-fns';
import Tracking from 'lib/tracking';
import ipcEvents from 'ipc-events';

import css from './trial-bar.module.css';
import { useLicenseValue } from 'lib/state/license';

const TrialBar: React.FC = () => {
  const license = useLicenseValue();

  const electronOnClick = (ev: React.MouseEvent<HTMLButtonElement>) => {
    ev.preventDefault();
    Tracking.trackEvent('Clicked days left');
    window.ipcRenderer.send(
      ipcEvents.APP__OPEN_EXTERNAL_REQUESTED,
      `https://www.diffchecker.com/buy-desktop?purchaseCode=${license?.purchaseCode}&utm_source=diffchecker&utm_medium=diffchecker-desktop&utm_campaign=nav-upgrade`,
    );
  };

  const daysLeftInLicense =
    differenceInDays(parseISO(license.expiresAt ?? ''), new Date()) + 1; // +1 to include today. when you make a trial, it'll say 13 days left otherwise
  const isExpiringSoon = daysLeftInLicense <= 3;

  return (
    <div className={cx('hide-print', css.hideOnMobile)} data-testid="trial-bar">
      <div
        className={cx(
          css.trialSection,
          isExpiringSoon && css.trialExpiringSoon,
        )}
      >
        <div className={cx(css.trialDaysRemaining, css.noDrag)}>
          <PlanBadge type="trial" />
          <span className={css.daysLeft}>
            {daysLeftInLicense} {pluralize('day', daysLeftInLicense)} left
          </span>
        </div>
        <div className={css.noDrag}>
          <Button
            style="primary"
            tone={isExpiringSoon ? 'orange' : 'green'}
            onClick={electronOnClick}
          >
            Upgrade now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrialBar;
