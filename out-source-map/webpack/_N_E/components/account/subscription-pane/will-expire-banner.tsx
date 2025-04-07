import Button from 'components/shared/button';
import { PlanTierHumanizedMap, type Subscription } from 'types/subscription';
import type { User } from 'types/user';

import css from './will-expire-bannter.module.css';
import { addDays, format } from 'date-fns';
import Tracking from 'lib/tracking';

interface AccountSubscriptionPaneWillExpireBannerProps {
  subscription: Subscription;
  user?: User;
  onRestoreSubscription?: () => void;
}

export const AccountSubscriptionPaneWillExpireBanner: React.FC<
  AccountSubscriptionPaneWillExpireBannerProps
> = ({ subscription, onRestoreSubscription }) => {
  const paidThroughDate = format(
    addDays(new Date(subscription.paidThroughDate), 1),
    'MMMM d, yyyy',
  );

  const handleClickRestore = () => {
    onRestoreSubscription?.();
    Tracking.trackEvent('Clicked restore subscription', {
      position: 'banner',
      type: 'will expire',
    });
  };

  return (
    <div className={css.banner}>
      <h3 className={css.header}>
        Your subscription is set to expire on {paidThroughDate}.
      </h3>
      <p className={css.recourse}>
        Restore your subscription to continue using Diffchecker{' '}
        {PlanTierHumanizedMap[subscription.planTier]}
      </p>
      <div className={css.buttons}>
        <Button
          style="primary"
          tone="orange"
          size="large"
          onClick={handleClickRestore}
        >
          Restore subscription
        </Button>
      </div>
    </div>
  );
};
