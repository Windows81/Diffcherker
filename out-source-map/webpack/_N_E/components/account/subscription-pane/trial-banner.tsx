import cx from 'classnames';
import Button from 'components/shared/button';
import {
  differenceInDays,
  intlFormat,
  intlFormatDistance,
  parseISO,
} from 'date-fns';

import css from '../subscription-pane.module.css';
import { PlanTier } from 'types/subscription';
import {
  LicenseState,
  initialState as initialLicenseState,
} from 'redux/modules/license-module';
import Tracking from 'lib/tracking';

interface AccountSubscriptionPaneTrialBannerProps {
  planTier: PlanTier;
  license?: LicenseState;
}

function trialWillEndSoon(license: LicenseState): boolean {
  return differenceInDays(parseISO(license.expiresAt ?? ''), new Date()) <= 7;
}

enum TrialBannerType {
  EXPIRED = 'trial expired',
  EXPIRING_SOON = 'trial expiring soon',
  NEW = 'trial',
}

const TrialBannerTypeStyleMap: Record<
  TrialBannerType,
  {
    bannerCssColor: string;
    buttonColor: 'red' | 'orange' | 'green';
  }
> = {
  [TrialBannerType.EXPIRED]: {
    bannerCssColor: css.accountSubscriptionPaneBannerRed,
    buttonColor: 'red',
  },
  [TrialBannerType.EXPIRING_SOON]: {
    bannerCssColor: css.accountSubscriptionPaneBannerOrange,
    buttonColor: 'orange',
  },
  [TrialBannerType.NEW]: {
    bannerCssColor: css.accountSubscriptionPaneBannerGreen,
    buttonColor: 'green',
  },
};

export const AccountSubscriptionPaneTrialBanner: React.FC<
  AccountSubscriptionPaneTrialBannerProps
> = ({ license = initialLicenseState }) => {
  const trialBannerType = license.isExpired
    ? TrialBannerType.EXPIRED
    : trialWillEndSoon(license)
      ? TrialBannerType.EXPIRING_SOON
      : TrialBannerType.NEW;

  const { bannerCssColor, buttonColor } =
    TrialBannerTypeStyleMap[trialBannerType];

  const handleClickUpgrade = () => {
    Tracking.trackEvent('Clicked own subscription banner button', {
      type: trialBannerType,
      ownSubscriptionButton: 'upgrade/buy',
    });
  };

  return (
    <div className={cx(css.accountSubscriptionPaneBanner, bannerCssColor)}>
      <h3 className={css.accountSubscriptionPaneBannerHeader}>
        {trialWillEndSoon(license) ? (
          license.isExpired ? (
            <>Your Diffchecker Pro Trial expired.</>
          ) : (
            <>Your Diffchecker Pro Trial will soon expire!</>
          )
        ) : (
          <>
            Your Diffchecker Pro Trial expires{' '}
            {intlFormatDistance(parseISO(license.expiresAt ?? ''), new Date())}.
          </>
        )}
      </h3>
      <p className={css.accountDangerZonePaneBannerInfo}>
        {license.isExpired
          ? 'Your trial expired on '
          : 'You can use your trial until '}
        {intlFormat(parseISO(license.expiresAt ?? ''), {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}{' '}
        <br />
        {license.isExpired
          ? 'Upgrade now to continue using Diffchecker Pro.'
          : 'Upgrade for the best Diffchecker experience. '}
      </p>
      <div>
        <Button
          nextLink
          href="/pricing"
          style="primary"
          tone={buttonColor}
          size="large"
          onClick={handleClickUpgrade}
        >
          Upgrade now
        </Button>
      </div>
    </div>
  );
};
