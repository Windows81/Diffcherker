import cx from 'classnames';
import Button from '../shared/button';
import PlanBadge from './plan-badge';
import pluralize from 'pluralize';
import { differenceInDays, parseISO } from 'date-fns';

import css from './trial-bar.module.css';
import { useAppSelector } from 'redux/store';

const TrialBar: React.FC = () => {
  const license = useAppSelector((state) => state.license);

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
        <div className={cx(css.trialDaysRemaining)}>
          <PlanBadge type="trial" />
          <span className={css.daysLeft}>
            {daysLeftInLicense} {pluralize('day', daysLeftInLicense)} left
          </span>
        </div>
        <div>
          <Button
            style="primary"
            tone={isExpiringSoon ? 'orange' : 'green'}
            href="/pricing"
            nextLink
            prefetch={false}
          >
            Upgrade now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrialBar;
