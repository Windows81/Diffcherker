import Button from 'components/shared/button';
import { PlanTierHumanizedMap, type Subscription } from 'types/subscription';
import type { User } from 'types/user';

import css from './expired-banner.module.css';
import { addDays, format } from 'date-fns';
import Tracking from 'lib/tracking';

interface AccountSubscriptionPaneExpiredBannerProps {
  subscription: Subscription;
  user?: User;
  onChangePaymentMethod?: () => void;
}

export const AccountSubscriptionPaneExpiredBanner: React.FC<
  AccountSubscriptionPaneExpiredBannerProps
> = ({ subscription, onChangePaymentMethod }) => {
  const isExpired = subscription.status === 'Expired';

  const paidThroughDate = format(
    addDays(new Date(subscription.paidThroughDate), 1),
    'MMMM d, yyyy',
  );

  const handleClickRestore = () => {
    onChangePaymentMethod?.();
    Tracking.trackEvent('Clicked restore subscription', {
      position: 'banner',
      type: isExpired ? 'expired' : 'failed',
    });
  };

  return (
    <div className={css.banner}>
      <h3 className={css.header}>
        {isExpired
          ? `Your subscription expired on ${paidThroughDate}.`
          : `Your payment failed and we were unable to renew your subscription.`}
      </h3>
      <p className={css.recourse}>
        Restore your subscription to continue using Diffchecker{' '}
        {PlanTierHumanizedMap[subscription.planTier]}
      </p>
      <div className={css.buttons}>
        <Button
          style="primary"
          tone="red"
          size="large"
          onClick={handleClickRestore}
        >
          Restore subscription
        </Button>
      </div>
    </div>
  );
};
