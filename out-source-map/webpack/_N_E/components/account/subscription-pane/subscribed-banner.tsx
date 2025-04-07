import cx from 'classnames';
import PlanBadge, { PlanBadgeType } from 'components/new/plan-badge';
import Button from 'components/shared/button';

import css from './subscribed-banner.module.css';
import { PlanTier, PlanTierHumanizedMap } from 'types/subscription';
import { LicenseState } from 'redux/modules/license-module';
import Tracking from 'lib/tracking';

interface AccountSubscriptionPaneSubscribedBannerProps {
  planTier: PlanTier;
  license?: LicenseState;
  managed: boolean;
  onUpgradeNow?: () => void;
  onBuyMoreSeats?: () => void;
}

export const AccountSubscriptionPaneSubscribedBanner: React.FC<
  AccountSubscriptionPaneSubscribedBannerProps
> = ({
  planTier,
  managed,
  onBuyMoreSeats = () => {
    /* do nothing */
  },
}) => {
  const hasNoActiveSubscriptions = planTier === 'free';

  const trackButtonClick = (button: string) => {
    Tracking.trackEvent('Clicked own subscription banner button', {
      type: hasNoActiveSubscriptions ? 'subscribed expired' : 'subscribed',
      ownSubscriptionButton: button,
    });
  };

  const handleClickPricing = () => trackButtonClick('pricing');
  return (
    <div className={cx(css.subscribedBanner)}>
      <div className={css.layout}>
        {['pro', 'enterprise'].includes(planTier) && (
          <div className={css.layoutLabel}>
            <PlanBadge type={planTier as PlanBadgeType} />
          </div>
        )}
        <div>
          <h3 className={css.header}>
            You are on the {PlanTierHumanizedMap[planTier]} plan
          </h3>
          <p>
            {hasNoActiveSubscriptions
              ? 'You have no remaining active subscriptions. Upgrade now for the best Diffchecker experience'
              : managed
                ? 'Your subscription is managed by an admin.'
                : 'We appreciate your support.'}
          </p>
          <div className={css.buttons}>
            {planTier === 'free' || planTier === 'api' || managed === true ? (
              <Button href="/pricing" style="primary" tone="green" size="large">
                {managed ? 'Buy your own subscription' : 'Upgrade now'}
              </Button>
            ) : (
              <Button
                style="primary"
                tone="green"
                size="large"
                onClick={() => onBuyMoreSeats()}
              >
                Buy more licenses
              </Button>
            )}

            <Button
              nextLink
              href="/pricing"
              style="secondary"
              tone="base"
              size="large"
              onClick={handleClickPricing}
            >
              Show pricing
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
