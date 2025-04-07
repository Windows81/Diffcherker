import Button from 'components/shared/button';
import { PlanTierHumanizedMap, type Subscription } from 'types/subscription';
import Tracking from 'lib/tracking';
import css from './expired-banner.module.css';

interface AccountSubscriptionPaneManagedRevokedBannerProps {
  subscription: Subscription;
}

export const AccountSubscriptionPaneManagedRevokedBanner: React.FC<
  AccountSubscriptionPaneManagedRevokedBannerProps
> = ({ subscription }) => {
  const handleClickUpgrade = () => {
    Tracking.trackEvent('Clicked own subscription banner button', {
      type: 'managed revoked',
      ownSubscriptionButton: 'upgrade/buy',
    });
  };

  return (
    <div className={css.banner}>
      <h3 className={css.header}>
        Your {PlanTierHumanizedMap[subscription.planTier]} plan was revoked
      </h3>
      <p className={css.recourse}>
        Your {PlanTierHumanizedMap[subscription.planTier]} managed by{' '}
        <a href={subscription.user.email}>{subscription.user.email}</a> was
        revoked by it&apos;s manager.
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
