import type { Subscription } from 'types/subscription';
import css from './details.module.css';
import { intlFormat } from 'date-fns';

import { PlanLookup } from 'lib/plans';
import { State, useAppDispatch, useAppSelector } from 'redux/store';
import type { License } from 'types/license';
import { useCallback, useEffect, useState } from 'react';

import * as PaymentsActions from 'redux/modules/payments-module';
import { AccountSubscriptionPaneTransactionsTable } from './transactions-table';
import AccountModalsLicenseAssign from '../modals/license-assign';
import AccountModalsLicenseUnassign from '../modals/license-unassign';
import Dropdown from 'components/shared/dropdown';
import EllipsisVerticalSvg from 'components/shared/icons/ellipsis-vertical.svg';
import AccountModalsChangePaymentMethod from '../modals/change-payment-method';
import AccountModalsRemovePaymentMethod from '../modals/remove-payment-method';
import { AccountSubscriptionPaneExpiredBanner } from './expired-banner';
import { AccountSubscriptionPaneWillExpireBanner } from './will-expire-banner';
import { AccountSubscriptionPaneApiKeyTable } from './api-key-table';
import Tracking from 'lib/tracking';
import AccountModalsCancel from '../modals/cancel';
import Skeletons from 'components/shared/loaders/skeletons';
import Skeleton from 'components/shared/loaders/skeleton';
import { BuyPaymentMethodBadge } from 'components/buy/payment-method-badge';

interface AccountSubscriptionPaneDetailsLicenseRowProps {
  license: License;
  subscription: Subscription;
  onAssign?: () => void;
  onUnassign?: () => void;
}
export const AccountSubscriptionPaneDetailsLicenseRow: React.FC<
  AccountSubscriptionPaneDetailsLicenseRowProps
> = ({ license, subscription, onAssign, onUnassign }) => {
  const [isLicenseShowing, setIsLiceneseShowing] = useState<boolean>(false);
  const isEnterprise = subscription.planTier === 'enterprise';
  const samlSsoConfigured = useAppSelector(
    (state) => state.organization.samlSsoConfigured,
  );

  return (
    <div className={css.licenseRow}>
      <div>
        <div
          className={
            isLicenseShowing
              ? css.licenseRowLicenseShowing
              : css.licenseRowLicenseHiding
          }
        >
          {license.key}
        </div>
        <button
          className="anchor-style"
          onClick={() => {
            Tracking.trackEvent('Toggled license key visibility', {
              toggledTo: isLicenseShowing ? 'hide' : 'show',
            });
            setIsLiceneseShowing(!isLicenseShowing);
          }}
        >
          {isLicenseShowing ? 'Hide' : 'Show'}
        </button>
      </div>
      <div className={css.licenseAssignee}>
        {license.user?.email ?? <span className="fadded-text">Unassigned</span>}{' '}
        <br />
        {isEnterprise && samlSsoConfigured ? (
          <span>Managed by SAML SSO</span>
        ) : license.user ? (
          <button className="anchor-style" onClick={onUnassign}>
            Unassign
          </button>
        ) : (
          <button className="anchor-style" onClick={onAssign}>
            Assign
          </button>
        )}
      </div>
    </div>
  );
};

interface AccountSubscriptionPaneDetailsProps {
  subscription: Subscription;
}

export const AccountSubscriptionPaneDetails: React.FC<
  AccountSubscriptionPaneDetailsProps
> = ({ subscription }) => {
  const dispatch = useAppDispatch();
  const features = useAppSelector((state: State) => state.app.features);
  const transactionsLoaded = useAppSelector(
    (state: State) =>
      state.payments.subscriptions.find((s) => s.id === subscription.id)
        ?.transactionsLoaded,
  );

  const [paymentsShowing, setPaymentsShowing] = useState<boolean>(false);
  const [assignLicenseFor, setAssignLicenseFor] = useState<License | null>(
    null,
  );
  const [unassignLicenseFor, setUnassignLicenseFor] = useState<License | null>(
    null,
  );
  const [changePaymentMethodFor, setChangePaymentMethodFor] =
    useState<Subscription | null>(null);
  const [removePaymentMethodFor, setRemovePaymentMethodFor] =
    useState<Subscription | null>(null);
  const [cancellingFor, setCancellingFor] = useState<Subscription | null>(null);
  const [transactionsLoading, setTransactionsLoading] =
    useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isSubscriptionInactive = ['Canceled', 'Expired', 'Past Due'].includes(
    subscription.status,
  );
  const isSubscriptionActive = !isSubscriptionInactive;
  const willExpire = !subscription.neverExpires;
  const hasCurrentPaymentMethod =
    subscription.paymentMethod && subscription.status === 'Active';

  const trackClickChangePaymentMethod = (
    position: string,
    type: 'change' | 'add' | 'remove',
  ) => {
    Tracking.trackEvent('Clicked change, add, or remove payment method', {
      position,
      type,
    });
  };

  useEffect(() => {
    if (paymentsShowing && !transactionsLoaded) {
      const fetchTransactions = async () => {
        setTransactionsLoading(true);
        await dispatch(
          PaymentsActions.getTransactionsForSubscription(subscription.id),
        );
        setTransactionsLoading(false);
      };
      fetchTransactions();
    }
  }, [dispatch, paymentsShowing, subscription.id, transactionsLoaded]);

  const cancelRestoreSubscription = useCallback(
    async (subscription: Subscription) => {
      setIsRestoring(true);
      try {
        await dispatch(
          PaymentsActions.patchSubscription({
            subscriptionId: subscription.id,
            attributes: {
              neverExpires: !subscription.neverExpires,
            },
          }),
        ).unwrap();
      } catch (error) {
        //TODO: Report errors to user
        console.error(error);
      } finally {
        Tracking.trackEvent('Set renew automatically', {
          value: !subscription.neverExpires,
        });
        setIsRestoring(false);
      }
    },
    [dispatch],
  );

  return (
    <div className={css.accountSubscriptionPaneDetails}>
      {isRestoring ? (
        <Skeletons spacing="xl">
          <Skeleton type="block" height="145px" />
        </Skeletons>
      ) : (
        <>
          {!subscription.isManual && (
            <>
              {isSubscriptionInactive && (
                <AccountSubscriptionPaneExpiredBanner
                  subscription={subscription}
                  onChangePaymentMethod={() =>
                    setChangePaymentMethodFor(subscription)
                  }
                />
              )}
              {isSubscriptionActive && willExpire && (
                <AccountSubscriptionPaneWillExpireBanner
                  subscription={subscription}
                  onRestoreSubscription={() =>
                    cancelRestoreSubscription(subscription)
                  }
                />
              )}
            </>
          )}
        </>
      )}

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
            <div className="section-title">Price</div>
          </div>
          ${(Number(subscription.price) * subscription.quantity).toFixed(2)}
          <br />
          <div className={css.billingCadence}>
            per {PlanLookup[subscription.planId]?.billing}
          </div>
        </div>
        <div className={css.column}>
          <div>
            <div className="section-title">
              {subscription.isManual ? 'Expires' : 'Renews'}
            </div>
          </div>
          {intlFormat(new Date(subscription.renewsOn), {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
        {!subscription.isManual && (
          <div>
            <div>
              <div className="section-title">Payment Method</div>
            </div>
            <div>
              <div>
                <BuyPaymentMethodBadge
                  showCardName={!!features.showCardNameOnDetails}
                  paymentMethod={subscription.paymentMethod}
                />
                {isSubscriptionActive &&
                  (hasCurrentPaymentMethod ? (
                    <button
                      className="anchor-style"
                      onClick={() => {
                        trackClickChangePaymentMethod(
                          'details table',
                          'change',
                        );
                        setChangePaymentMethodFor(subscription);
                      }}
                    >
                      Change
                    </button>
                  ) : (
                    <button
                      className="anchor-style"
                      onClick={() => {
                        trackClickChangePaymentMethod('details table', 'add');
                        setChangePaymentMethodFor(subscription);
                      }}
                    >
                      Add payment method
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}
        <div className={css.column} style={{ marginRight: 0 }}>
          {!subscription.isManual && isSubscriptionActive && (
            <Dropdown
              rightAlign
              onOpen={() => {
                Tracking.trackEvent('Opened subscription details dropdown');
              }}
              isOpen={isDropdownOpen}
              setIsOpen={setIsDropdownOpen}
              display={EllipsisVerticalSvg}
              onChange={async (option) => {
                if (option.value === 'changePaymentMethod') {
                  trackClickChangePaymentMethod(
                    'dropdown',
                    hasCurrentPaymentMethod ? 'change' : 'add',
                  );
                  setChangePaymentMethodFor(subscription);
                } else if (option.value === 'restoreSubscription') {
                  Tracking.trackEvent('Clicked restore subscription', {
                    position: 'dropdown',
                    type: willExpire ? 'will expire' : 'expired',
                  });
                  cancelRestoreSubscription(subscription);
                } else if (option.value === 'cancelSubscription') {
                  Tracking.trackEvent('Clicked cancel subscription', {
                    position: 'dropdown',
                  });
                  setCancellingFor(subscription);
                }
              }}
              options={[
                {
                  label: hasCurrentPaymentMethod
                    ? 'Change payment method'
                    : 'Add payment Method',
                  value: 'changePaymentMethod',
                },
                {
                  label: 'Restore subscription',
                  value: 'restoreSubscription',
                  hide: subscription.neverExpires || isSubscriptionInactive,
                },
                {
                  label: 'Cancel subscription',
                  value: 'cancelSubscription',
                  tone: 'red',
                  hide: !subscription.neverExpires || isSubscriptionInactive,
                },
              ]}
            />
          )}
        </div>
      </div>
      {isSubscriptionActive && !!subscription.licenses?.length && (
        <div className={css.licenses}>
          <h3 className="section-title">
            Licenses ({subscription.licenses.length})
          </h3>
          {subscription.licenses.map((license) => (
            <AccountSubscriptionPaneDetailsLicenseRow
              key={license.key}
              license={license}
              subscription={subscription}
              onAssign={() => {
                setAssignLicenseFor(license);
              }}
              onUnassign={() => {
                setUnassignLicenseFor(license);
              }}
            />
          ))}
        </div>
      )}
      {isSubscriptionActive && subscription.apiKey && (
        <AccountSubscriptionPaneApiKeyTable apiKey={subscription.apiKey} />
      )}
      {!subscription.isManual &&
        (paymentsShowing ? (
          transactionsLoading ? (
            <Skeletons spacing="medium">
              <Skeleton width="100px" type="text" />
              <Skeleton type="text" />
              <Skeleton type="text" />
              <Skeleton type="text" />
            </Skeletons>
          ) : (
            <>
              <h2 className={css.paymentHistoryHeading}>Payment History</h2>
              <AccountSubscriptionPaneTransactionsTable
                transactions={subscription.transactions}
              />
              <button
                className="anchor-style"
                onClick={() => {
                  Tracking.trackEvent('Toggled payment history', {
                    toggledTo: 'hide',
                  });
                  setPaymentsShowing(false);
                }}
              >
                Hide Payment History
              </button>
            </>
          )
        ) : (
          <button
            className="anchor-style"
            onClick={() => {
              Tracking.trackEvent('Toggled payment history', {
                toggledTo: 'show',
              });
              setPaymentsShowing(true);
            }}
          >
            Show Payment History
          </button>
        ))}
      {
        <>
          <AccountModalsLicenseUnassign
            license={unassignLicenseFor}
            isOpen={!!unassignLicenseFor}
            closeModal={() => setUnassignLicenseFor(null)}
          />

          <AccountModalsLicenseAssign
            licenseKey={assignLicenseFor?.key ?? ''}
            isOpen={!!assignLicenseFor}
            closeModal={() => setAssignLicenseFor(null)}
          />

          <AccountModalsChangePaymentMethod
            subscription={changePaymentMethodFor}
            isOpen={!!changePaymentMethodFor}
            closeModal={() => setChangePaymentMethodFor(null)}
            onRemovePaymentMethod={(subscription) => {
              setChangePaymentMethodFor(null);
              setRemovePaymentMethodFor(subscription);
            }}
          />

          <AccountModalsRemovePaymentMethod
            subscription={removePaymentMethodFor}
            isOpen={!!removePaymentMethodFor}
            onCancel={(subscription) => {
              setRemovePaymentMethodFor(null);
              setChangePaymentMethodFor(subscription);
            }}
            closeModal={() => {
              setRemovePaymentMethodFor(null);
            }}
            onRemove={() => {
              setRemovePaymentMethodFor(null);
            }}
          />
          <AccountModalsCancel
            subscription={cancellingFor}
            isOpen={!!cancellingFor}
            onConfirmCancel={async () => {
              await cancelRestoreSubscription(subscription);
              setCancellingFor(null);
            }}
            onAbortCancel={() => setCancellingFor(null)}
            closeModal={() => setCancellingFor(null)}
          />
        </>
      }
    </div>
  );
};
