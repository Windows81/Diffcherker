import {
  isExpiredTrialUser,
  isFreeUser,
  isFreeUserWithLicenses,
  isTrialUser,
} from 'redux/selectors/user-selector';
import { type State, useAppSelector } from 'redux/store';

import css from './subscription-pane.module.css';
import { AccountSubscriptionPaneFreeBanner } from './subscription-pane/free-banner';
import { AccountSubscriptionPaneSubscribedBanner } from './subscription-pane/subscribed-banner';
import { AccountSubscriptionPaneTrialBanner } from './subscription-pane/trial-banner';
import { AccountSubscriptionPaneDetails } from './subscription-pane/details';
import AccountSubscriptionPaneManagedDetails from './subscription-pane/managed-details';
import { AccountSubscriptionPaneLacksOwnLicenseBanner } from './subscription-pane/lacks-own-license-banner';
import BuyAdditionalSeatsModal from '../buy/additional-seats-modal';
import { useState } from 'react';
import { Subscription } from 'types/subscription';
import { PlanLookup, isPlanOnOffer } from 'lib/plans';
import { useRouter } from 'next/router';

enum SubscriptionPaneBannerType {
  FREE,
  FREE_WITH_LICENSES,
  SUBSCRIBED,
  TRIAL,
  ENTERPRISE,
}

const SubscriptionPaneBannerTypeComponentMap: Record<
  SubscriptionPaneBannerType,
  React.ElementType
> = {
  [SubscriptionPaneBannerType.FREE]: AccountSubscriptionPaneFreeBanner,
  [SubscriptionPaneBannerType.FREE_WITH_LICENSES]:
    AccountSubscriptionPaneFreeBanner,
  [SubscriptionPaneBannerType.SUBSCRIBED]:
    AccountSubscriptionPaneSubscribedBanner,
  [SubscriptionPaneBannerType.TRIAL]: AccountSubscriptionPaneTrialBanner,
  [SubscriptionPaneBannerType.ENTERPRISE]: AccountSubscriptionPaneFreeBanner,
};

export const AccountSubscriptionPane: React.FC = () => {
  const user = useAppSelector((store: State) => store.user.user);
  const license = useAppSelector((store: State) => store.license);
  const ownSubscription = license.subscription;
  const adminSubscriptions = useAppSelector(
    (store: State) => store.payments.subscriptions,
  );
  const [buyMoreSeatsFor, setBuyMoreSeatsFor] = useState<
    Subscription | undefined
  >();

  const router = useRouter();

  const paymentMethods = useAppSelector(
    (state: State) => state.payments.paymentMethods,
  );

  const subscriptions = adminSubscriptions.length
    ? adminSubscriptions
    : ownSubscription
      ? [ownSubscription]
      : [];

  const hasSubscriptions = !!subscriptions.length;

  const latestLicenseSubscription = subscriptions.find(
    (subscription) => !!subscription.licenses?.length,
  );

  const hasManagedSubscription =
    ownSubscription &&
    !adminSubscriptions.find(
      (subscription) => subscription.id === ownSubscription.id,
    );
  const onlyHasManagedSubscription =
    ownSubscription && !adminSubscriptions.length;

  let subscriptionPaneBannerType = SubscriptionPaneBannerType.FREE;

  subscriptionPaneBannerType = useAppSelector(isFreeUser)
    ? SubscriptionPaneBannerType.FREE
    : subscriptionPaneBannerType;
  subscriptionPaneBannerType = useAppSelector(isFreeUserWithLicenses)
    ? SubscriptionPaneBannerType.FREE_WITH_LICENSES
    : subscriptionPaneBannerType;
  subscriptionPaneBannerType = hasSubscriptions
    ? SubscriptionPaneBannerType.SUBSCRIBED
    : subscriptionPaneBannerType;
  subscriptionPaneBannerType = useAppSelector(isTrialUser)
    ? SubscriptionPaneBannerType.TRIAL
    : subscriptionPaneBannerType;
  subscriptionPaneBannerType = useAppSelector(isExpiredTrialUser)
    ? SubscriptionPaneBannerType.TRIAL
    : subscriptionPaneBannerType;

  const BannerComponent =
    SubscriptionPaneBannerTypeComponentMap[subscriptionPaneBannerType];

  const lacksOwnLicense = hasSubscriptions && !license.key;

  return (
    <div className={css.accountSubscriptionPane}>
      <h2 className={css.accountSubscriptionPaneHeader}>Subscription</h2>

      <BannerComponent
        managed={onlyHasManagedSubscription}
        license={license}
        planTier={user?.planTier ?? 'free'}
        onBuyMoreSeats={() => {
          if (!latestLicenseSubscription) {
            return;
          }

          if (isPlanOnOffer(PlanLookup[latestLicenseSubscription.planId])) {
            setBuyMoreSeatsFor(latestLicenseSubscription);
          } else {
            router.push('/pricing');
          }
        }}
      />

      {lacksOwnLicense && (
        <AccountSubscriptionPaneLacksOwnLicenseBanner
          planTier={user?.planTier ?? 'free'}
        />
      )}
      {subscriptions.length > 0 && (
        <div className={css.container}>
          <h2 className={css.containerHeader}>
            {subscriptions.length > 1
              ? 'Subscriptions'
              : 'Subscription details'}
          </h2>
          {onlyHasManagedSubscription ? (
            <AccountSubscriptionPaneManagedDetails
              subscription={ownSubscription}
              license={license}
            />
          ) : (
            <div className={css.subscriptions}>
              {hasManagedSubscription && (
                <AccountSubscriptionPaneManagedDetails
                  subscription={ownSubscription}
                  license={license}
                />
              )}
              {adminSubscriptions.map((subscription) => (
                <AccountSubscriptionPaneDetails
                  key={subscription.id}
                  subscription={subscription}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {latestLicenseSubscription && (
        <BuyAdditionalSeatsModal
          subscription={latestLicenseSubscription}
          isOpen={!!buyMoreSeatsFor}
          closeModal={() => {
            setBuyMoreSeatsFor(undefined);
          }}
          paymentMethods={paymentMethods}
        />
      )}
    </div>
  );
};
