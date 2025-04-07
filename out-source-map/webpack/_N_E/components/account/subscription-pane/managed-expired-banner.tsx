import Button from 'components/shared/button';
import { PlanTierHumanizedMap, type Subscription } from 'types/subscription';
import Tracking from 'lib/tracking';
import css from './expired-banner.module.css';

interface AccountSubscriptionPaneManagedExpiredBannerProps {
  subscription: Subscription;
}

export const AccountSubscriptionPaneManagedExpiredBanner: React.FC<
  AccountSubscriptionPaneManagedExpiredBannerProps
> = ({ subscription }) => {
  const handleClickUpgrade = () => {
    Tracking.trackEvent('Clicked own subscription banner button', {
      type: 'managed expired',
      ownSubscriptionButton: 'upgrade/buy',
    });
  };

  return (
    <div className={css.banner}>
      <h3 className={css.header}>
        Your {PlanTierHumanizedMap[subscription.planTier]} plan has expired
      </h3>
      <p className={css.recourse}>
        Your {PlanTierHumanizedMap[subscription.planTier]} managed by{' '}
        <a href={subscription.user.email}>{subscription.user.email}</a> has
        expired.
        <br />
        Upgrade now to continue using Diffchecker{' '}
        {PlanTierHumanizedMap[subscription.planTier]} and Diffchecker Desktop.
      </p>
      <div className={css.buttons}>
        <Button
          href="/pricing"
          style="primary"
          tone="red"
          size="large"
          onClick={handleClickUpgrade}
        >
          Upgrade now
        </Button>
      </div>
    </div>
  );
};
