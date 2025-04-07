import * as React from 'react';

import Modal, {
  NotifyingCloseModalProps,
  makeStateless,
} from 'components/shared/modal';
import { BuyPaymentMethodSelector } from '../../buy/payment-method/selector';
import { Subscription } from 'types/subscription';
import css from './change-payment-method.module.css';
import { ActiveView } from 'braintree-web-drop-in';
import { useState, useCallback, useEffect } from 'react';
import { Payload } from 'models/payments-model';
import Button from 'components/shared/button';
import Tracking from 'lib/tracking';
import * as PaymentsModel from 'models/payments-model';
import * as PaymentsActions from 'redux/modules/payments-module';
import { State, useAppDispatch, useAppSelector } from 'redux/store';
import MessageBanner from 'components/shared/message-banner';
import dropin from 'braintree-web-drop-in';
import { BuyPaymentMethodBadge } from 'components/buy/payment-method-badge';
import { normalizeError } from 'lib/messages';

interface AccountModalsChangePaymentMethodProps
  extends NotifyingCloseModalProps {
  isOpen: boolean;
  closeModal: () => void;
  onRemovePaymentMethod: (subscription: Subscription | null) => void;
  subscription: Subscription | null;
}

const AccountModalsChangePaymentMethod: React.FC<
  AccountModalsChangePaymentMethodProps
> = ({ isOpen, closeModal, onRemovePaymentMethod, subscription, didClose }) => {
  const dispatch = useAppDispatch();
  const [currentViewId, setCurrentViewId] = useState<ActiveView>('options');
  const [paymentPayload, setPaymentPayload] = useState<Payload | undefined>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<Error>();
  const features = useAppSelector((state: State) => state.app.features);
  const paymentMethods = useAppSelector(
    (state: State) => state.payments.paymentMethods,
  );

  const isSelecting = currentViewId === 'options' && !paymentPayload;

  const hasCurrentPaymentMethod = !!subscription?.paymentMethod;
  const isMissingPaymentMethod = !hasCurrentPaymentMethod;

  const isSubscriptionActive = subscription?.status === 'Active';
  const isSubscriptionInactive = !isSubscriptionActive;

  const selectableExistingPaymentMethods = isSubscriptionInactive
    ? paymentMethods
    : paymentMethods.filter(
        (method) => method.token !== subscription?.paymentMethod?.token,
      );

  const renewSubscription = useCallback(
    async (id: string, payload?: Payload): Promise<void> => {
      const updatingMethod = !!payload;
      const tryEvent = updatingMethod
        ? 'Tried changing and renewing'
        : 'Tried renewing';
      const successEvent = updatingMethod
        ? 'Succeeded changing and renewing'
        : 'Succeeded renewing';
      const failEvent = updatingMethod
        ? 'Failed changing and renewing'
        : 'Failed renewing';

      try {
        Tracking.trackEvent(tryEvent);
        await PaymentsModel.renewSubscription(id, payload);
        Tracking.trackEvent(successEvent);
        window.location.reload();
      } catch (error) {
        Tracking.trackEvent(failEvent, { error });
        throw error;
      }
    },
    [],
  );

  useEffect(() => {
    (async () => {
      try {
        await dispatch(PaymentsActions.getMyPaymentMethods()).unwrap();
      } catch (e) {
        console.error(e);
      }
    })();
  }, [dispatch]);

  return (
    <Modal
      isOpen={isOpen}
      didClose={didClose}
      stateless={true}
      closeModal={() => {
        closeModal();
      }}
      maxWidth="650px"
    >
      <h1 className={css.header}>
        {isMissingPaymentMethod
          ? 'Add Payment Method'
          : isSubscriptionInactive
            ? 'Restore with payment method'
            : 'Change payment method'}
      </h1>

      <BuyPaymentMethodSelector
        paymentMethods={selectableExistingPaymentMethods}
        onViewChange={(payload: dropin.ChangeActiveViewPayload) => {
          setError(undefined);
          setCurrentViewId(payload.newViewId);

          if (payload.newViewId !== 'methods') {
            setPaymentPayload(undefined);
          }
        }}
        onPaymentMethodChosen={async (payload: Payload) =>
          setPaymentPayload(payload)
        }
        onPaymentMethodCleared={() => setPaymentPayload(undefined)}
      />
      {hasCurrentPaymentMethod && isSubscriptionActive && isSelecting && (
        <>
          <h2 className={css.smallHeader}>Current payment method</h2>
          <div className={css.currentPaymentMethod}>
            <div>
              <BuyPaymentMethodBadge
                showCardName={true}
                paymentMethod={subscription.paymentMethod}
              />
              {features.allowCardRemovals && (
                <button
                  className="anchor-style red"
                  onClick={() => {
                    Tracking.trackEvent(
                      'Clicked change, add, or remove payment method',
                      {
                        position: 'change payment method modal',
                        type: 'remove',
                      },
                    );
                    onRemovePaymentMethod(subscription);
                  }}
                >
                  Remove payment method
                </button>
              )}
            </div>
          </div>
        </>
      )}
      {error && (
        <MessageBanner
          className={css.errorBox}
          type="error"
          title={error.message}
        />
      )}
      {paymentPayload && (
        <Button
          className={css.addChangeButton}
          size="large"
          style="primary"
          tone="green"
          isLoading={isSubmitting}
          fullWidth
          onClick={async () => {
            setError(undefined);
            if (subscription) {
              try {
                setIsSubmitting(true);
                if (isSubscriptionInactive) {
                  return await renewSubscription(
                    subscription.id.toString(),
                    paymentPayload,
                  );
                }
                await dispatch(
                  PaymentsActions.updatePaymentMethodForSubscription({
                    subscriptionId: subscription.id,
                    method: paymentPayload,
                  }),
                ).unwrap();
                closeModal();
              } catch (e: unknown) {
                Tracking.trackEvent('Failed adding card', {
                  error,
                });
                setError(normalizeError(e));
              } finally {
                setIsSubmitting(false);
              }
            }
          }}
        >
          Use this payment method
        </Button>
      )}
      {isSelecting && (
        <Button
          style="secondary"
          tone="base"
          onClick={closeModal}
          size="large"
          fullWidth
        >
          Cancel
        </Button>
      )}
    </Modal>
  );
};

export default makeStateless(AccountModalsChangePaymentMethod);
