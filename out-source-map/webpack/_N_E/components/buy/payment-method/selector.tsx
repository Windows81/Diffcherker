import { Dropin } from 'braintree-web-drop-in';
// import braintree from 'braintree';
import { Card, Payload } from 'models/payments-model';
import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch } from 'redux/store';
import { OurPaymentMethod } from 'types/payment-method';
import * as PaymentsActions from 'redux/modules/payments-module';
import css from './selector.module.css';

import MessageBanner from 'components/shared/message-banner';
import Button from 'components/shared/button';

import dropin from 'braintree-web-drop-in';
import Skeletons from 'components/shared/loaders/skeletons';
import Skeleton from 'components/shared/loaders/skeleton';
import { BuyPaymentMethodButton } from './button';
import cx from 'classnames';
import BuyPaymentMethodBillingAddressForm from './billing-address-form';
import Tracking from 'lib/tracking';
import { normalizeError } from 'lib/messages';

const tokenToPayload = (token?: string) => {
  return token
    ? ({
        paymentMethodToken: token,
      } as Payload)
    : undefined;
};

interface BuyPaymentMethodSelectorProps {
  dropInContainerId?: string;
  paymentMethods?: OurPaymentMethod[];
  onPaymentMethodChosen?: (payload: Payload) => void;
  onPaymentMethodCleared?: () => void;
  onViewChange?: (payload: dropin.ChangeActiveViewPayload) => void;
  defaultPaymentMethodToken?: string;
  renewTotal?: string;
  existingPaymentMethodsLoading?: boolean;
}

export const BuyPaymentMethodSelector = ({
  paymentMethods,
  dropInContainerId = 'dropin-subscription-id',
  onPaymentMethodChosen = () => {
    /** do nothing */
  },
  onPaymentMethodCleared = () => {
    /** do nothing */
  },
  onViewChange = () => {
    /** do nothing */
  },
  defaultPaymentMethodToken,
  existingPaymentMethodsLoading = false,
}: BuyPaymentMethodSelectorProps) => {
  const dispatch = useAppDispatch();
  const [dropIn, setDropIn] = useState<Dropin | null>(null);
  const [initing, setIniting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error>();

  const [cardPaymentChosen, setCardPaymentChosen] = useState(false);
  const [paypalPaymentChosen, setPaypalPaymentChosen] = useState(false);
  const [paymentPayload, setPaymentPayload] = useState<Payload | undefined>(
    tokenToPayload(defaultPaymentMethodToken),
  );
  const [isViewingOptions, setIsViewingOptions] = useState<boolean>(true);

  /**
   * Once the payment nonce is `requestable` this method can be called to collect the nonce, along with
   * additional information and sent to the
   */
  const fetchPaymentNonce = useCallback(
    async (billingAddressDetails?: Card) => {
      // Cant't submit if the payment nonce is not requestable (only available if use has filled out CC portion of the form - OR - paypal steps haven't completed)
      if (!dropIn?.isPaymentMethodRequestable()) {
        return;
      }

      try {
        setSubmitting(true);
        setError(undefined);

        const payload = await dropIn?.requestPaymentMethod();

        const paymentPayload = {
          paymentMethodNonce: payload?.nonce,
          deviceData: payload?.deviceData,
          card: billingAddressDetails,
        };

        /**
         * This is here to normalize when the "onPaymentMethodChosen" event is triggered, on account of when visual state of the
         * braintree dropIn container changes. This ensures the paymemtPayload is always emitted _after_ the visual state of the
         * dropIn container changes from successful card addition / paypal method addition.
         *
         * 1. If you've added a credit card, we defer the "onPaymentMethodChosen" even until after the dropIn container's view state changes
         * 2. If you've successfully chosen your paypal account, the dropInContainer's view state changes before this callback is hit, so we
         * should emit the event right away.
         */
        const paymentMethodChosen = () => {
          setPaymentPayload(paymentPayload);
          onPaymentMethodChosen(paymentPayload);

          //Process.nextTick can be removed once this is dealt with: https://github.com/braintree/event-emitter/issues/21
          process.nextTick(() =>
            dropIn.off('changeActiveView', paymentMethodChosen),
          );
        };

        if (paypalPaymentChosen) {
          paymentMethodChosen();
        } else {
          dropIn.on('changeActiveView', paymentMethodChosen);
        }
      } catch (error) {
        Tracking.trackEvent('Failed adding card', {
          error,
        });
        setError(normalizeError(error));
        dropIn?.clearSelectedPaymentMethod();
      } finally {
        setSubmitting(false);
      }
    },
    [dropIn, paypalPaymentChosen, onPaymentMethodChosen],
  );

  /**
   * Initialize the Braintree Dropin Container
   * Fetches the necessary client token and initializes the braintree dropin component using the dropInContainerId
   */
  useEffect(() => {
    setIniting(true);
    (async () => {
      try {
        const { token } = await dispatch(
          PaymentsActions.getClientToken(),
        ).unwrap();

        const _dropIn = await dropin.create({
          authorization: token,
          container: `#${dropInContainerId}`,
          dataCollector: true,
          paypal: {
            flow: 'vault',
          },
          card: {
            overrides: {
              styles: {
                input: {
                  'font-size': '13px',
                },
              },
            },
            cardholderName: {
              required: true,
            },
          },
        });
        setIniting(false);

        setDropIn(_dropIn);
      } catch (error) {
        setError(normalizeError(error));
      } finally {
        setIniting(false);
      }
    })();
  }, [dispatch, dropInContainerId]);

  /**
   * Setup/Teardown of event handlers on the Braintree Dropin Container
   * Watches necessary
   */
  useEffect(() => {
    const handleChangeActiveView = (
      payload: dropin.ChangeActiveViewPayload,
    ) => {
      setIsViewingOptions(payload.newViewId === 'options');
      setCardPaymentChosen(payload.newViewId === 'card');
      setPaypalPaymentChosen(payload.newViewId === 'paypal');

      onViewChange(payload);
    };

    //Handle payapal case, by waiting for the 'requestable' event and then requesting the nonce
    const handlePaymentMethodRequestable = () => {
      if (paypalPaymentChosen) {
        fetchPaymentNonce();
      }
    };

    if (dropIn) {
      dropIn.on('changeActiveView', handleChangeActiveView);
      dropIn.on('paymentMethodRequestable', handlePaymentMethodRequestable);
    }

    return () => {
      dropIn?.off('changeActiveView', handleChangeActiveView);
      dropIn?.off('paymentMethodRequestable', handlePaymentMethodRequestable);
    };
  }, [
    dropIn,
    paymentPayload,
    paypalPaymentChosen,
    onViewChange,
    fetchPaymentNonce,
    onPaymentMethodChosen,
  ]);

  const existingMethodSelected = paymentMethods?.find(
    (method) => method.token === paymentPayload?.paymentMethodToken,
  );

  const showBillingAddressForm = dropIn && cardPaymentChosen;
  const showExistingPaymentMethods =
    isViewingOptions && !!paymentMethods?.length;
  const showNewPaymentMethods = isViewingOptions && !existingMethodSelected;
  const hideDropInContainer = initing || existingMethodSelected;

  return (
    <>
      {existingPaymentMethodsLoading ? (
        <Skeletons>
          <Skeleton height="25px" width="220px" />
          <Skeleton height="55px" />
        </Skeletons>
      ) : (
        showExistingPaymentMethods && (
          <>
            <h2 className={css.smallHeader}>Choose existing payment method</h2>
            {existingMethodSelected ? (
              <BuyPaymentMethodButton
                paymentMethod={existingMethodSelected}
                isSelected={true}
              />
            ) : (
              paymentMethods.map((method) => (
                <BuyPaymentMethodButton
                  paymentMethod={method}
                  key={method.token}
                  isSelected={
                    method.token === paymentPayload?.paymentMethodToken
                  }
                  onClick={() => {
                    const paymentPayload = tokenToPayload(method.token);
                    if (paymentPayload) {
                      setPaymentPayload(paymentPayload);
                      onPaymentMethodChosen(paymentPayload);
                    }
                  }}
                />
              ))
            )}
          </>
        )
      )}

      {showNewPaymentMethods && (
        <h2 className={css.smallHeader}>Select payment method</h2>
      )}
      <div className={cx(css.braintreeSelector)}>
        <div
          id={dropInContainerId}
          className={hideDropInContainer && css.hideDropInContainer}
        />
        {initing && !existingMethodSelected ? (
          <Skeletons>
            <Skeleton height="55px" />
            <Skeleton height="55px" />
          </Skeletons>
        ) : (
          <>
            {showBillingAddressForm && (
              <BuyPaymentMethodBillingAddressForm
                submitting={submitting}
                onSubmit={fetchPaymentNonce}
                onChooseAnotherMethod={() => {
                  setPaymentPayload(undefined);
                  dropIn?.clearSelectedPaymentMethod();
                  onPaymentMethodCleared();
                }}
              />
            )}
            {(paypalPaymentChosen ||
              existingMethodSelected ||
              paymentPayload) && (
              <div className={css.chooseAnotherMethod}>
                <Button
                  onClick={() => {
                    setPaymentPayload(undefined);
                    dropIn?.clearSelectedPaymentMethod();
                    onPaymentMethodCleared();
                  }}
                  style="secondary"
                  tone="base"
                  size="large"
                  fullWidth
                >
                  Choose another method
                </Button>
              </div>
            )}
            {!submitting && error && (
              <MessageBanner
                type="error"
                title={
                  dropIn
                    ? 'Something went wrong with your payment. Please check your credit card details.'
                    : 'Something went wrong with our payment processor gateway.'
                }
                message={error.message}
              />
            )}
          </>
        )}
      </div>
    </>
  );
};
