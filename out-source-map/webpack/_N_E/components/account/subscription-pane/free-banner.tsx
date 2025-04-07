import cx from 'classnames';
import Button from 'components/shared/button';
import type { PlanTier } from 'types/subscription';

import css from '../subscription-pane.module.css';
import { LicenseState } from 'redux/modules/license-module';
import Tracking from 'lib/tracking';

interface AccountSubscriptionPaneBannerProps {
  planTier: PlanTier;
  license?: LicenseState;
}

export const AccountSubscriptionPaneFreeBanner: React.FC<
  AccountSubscriptionPaneBannerProps
> = () => {
  const handleClickUpgrade = () => {
    Tracking.trackEvent('Clicked own subscription banner button', {
      type: 'free',
      ownSubscriptionButton: 'upgrade/buy',
    });
  };

  return (
    <div
      className={cx(
        css.accountSubscriptionPaneBanner,
        css.accountSubscriptionPaneBannerGreen,
      )}
    >
      <h3 className={css.accountSubscriptionPaneBannerHeader}>
        You are on the Free Plan
      </h3>
      <p className={css.accountDangerZonePaneBannerInfo}>
        Upgrade for an ad-free experience, unlimited access to the desktop app
        and premium features such as real-time diff, advanced text-comparing
        tools and more.
      </p>
      <div>
        <Button
          nextLink
          href="/pricing"
          style="primary"
          tone="green"
          size="large"
          onClick={handleClickUpgrade}
        >
          Upgrade now
        </Button>
      </div>
    </div>
  );
};
