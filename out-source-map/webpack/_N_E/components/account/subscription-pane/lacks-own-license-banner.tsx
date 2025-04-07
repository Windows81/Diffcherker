import { PlanTier, PlanTierHumanizedMap } from 'types/subscription';

import css from './lacks-own-license-banner.module.css';
import { useAppSelector } from 'redux/store';

interface AccountSubscriptionPaneLacksOwnLicenseBannerProps {
  planTier: PlanTier;
}

export const AccountSubscriptionPaneLacksOwnLicenseBanner: React.FC<
  AccountSubscriptionPaneLacksOwnLicenseBannerProps
> = ({ planTier }) => {
  const user = useAppSelector((state) => state.user.user);

  return (
    <div className={css.banner}>
      <h3 className={css.header}>Missing own license</h3>
      <p className={css.recourse}>
        No valid license has been assigned to this account. To gain access to
        Diffchecker {PlanTierHumanizedMap[planTier]} features with this account,
        ensure that a license is assigned to <strong>{user?.email}</strong>{' '}
        below.
      </p>
    </div>
  );
};
