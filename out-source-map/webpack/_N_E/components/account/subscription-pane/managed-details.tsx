import { Subscription } from 'types/subscription';
import css from './details.module.css';
import { PlanLookup } from 'lib/plans';
import { addDays, intlFormat } from 'date-fns';
import { AccountSubscriptionPaneManagedExpiredBanner } from './managed-expired-banner';
import { AccountSubscriptionPaneManagedRevokedBanner } from './managed-revoked-banner';
import { LicenseState } from 'redux/modules/license-module';

interface AccountSubscriptionPaneManagedDetailsProps {
  subscription: Subscription;
  license: LicenseState;
}

export const AccountSubscriptionPaneManagedDetails: React.FC<
  AccountSubscriptionPaneManagedDetailsProps
> = ({ subscription, license }) => {
  if (subscription.status === 'Expired') {
    return (
      <AccountSubscriptionPaneManagedExpiredBanner
        subscription={subscription}
      />
    );
  }

  if (license.isRevoked) {
    return (
      <AccountSubscriptionPaneManagedRevokedBanner
        subscription={subscription}
      />
    );
  }

  return (
    <div className={css.accountSubscriptionPaneDetails}>
      <div className={css.table}>
        <div className={css.column}>
          <div>
            <div className="section-title">Plan</div>
          </div>
          {PlanLookup[subscription.planId]?.name ?? 'Unknown'}
        </div>
        <div className={css.column}>
          <div>
            <div className="section-title">Status</div>
          </div>
          <div
            className={subscription.status !== 'Active' ? css.red : undefined}
          >
            {subscription.status}
          </div>
        </div>
        <div className={css.column}>
          <div>
            <div className="section-title">Managed By</div>
          </div>
          {subscription.user?.email}
        </div>
        <div className={css.column}>
          <div>
            <div className="section-title">Expires</div>
          </div>
          {intlFormat(addDays(new Date(subscription.paidThroughDate), 1), {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
        <div className={css.column}>
          <div>
            <div className="section-title">License Key</div>
          </div>
          {license.key}
        </div>
      </div>
    </div>
  );
};

export default AccountSubscriptionPaneManagedDetails;
