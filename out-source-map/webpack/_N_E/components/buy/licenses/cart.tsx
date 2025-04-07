import Button from 'components/shared/button';
import TextInput from 'components/shared/form/text-input';
import { BuyPaymentMethodSelector } from '../payment-method/selector';
import BuyLicensesCartSummary from './cart-summary';

import { Plan } from 'lib/plans';
import PlusIconSVG from 'components/shared/icons/plus.svg';
import MinusIconSVG from 'components/shared/icons/minus.svg';
import { OurPaymentMethod } from 'types/payment-method';
import { Subscription } from 'types/subscription';
import { useEffect, useRef, useState } from 'react';
import { Payload, upgradeProration } from 'models/payments-model';
import css from './cart.module.css';
import { AxiosResponse } from 'axios';
import MessageBanner from 'components/shared/message-banner';
import { normalizeError } from 'lib/messages';
import Tracking from 'lib/tracking';

/**
 * Converts a number to a string for the input field
 * Our input field doesn't need to support 0 or negative numbers
 * but does need to support an empty string to reset the value to 0
 * @param value - The number to convert
 * @returns An empty string if the value is 0, otherwise the value as a string
 */
const valueToInput = (value: number) => {
  return value === 0 ? '' : value;
};

/**
 * Converts an input string to a number
 * Our input field doesn't need to support 0 or negative numbers
 * but does need to support an empty string to reset the value to 0
 * @param input - The string to convert
 * @returns 0 if the input is an empty string, otherwise the number represented by the input
 */
const inputToValue = (input: string): number => {
  return input === '' ? 0 : parseInt(input);
};

export type PurchaseRequest = {
  quantity: number;
  plan: Plan;
  paymentMethodPayload: Payload;
  existingSubscription?: Subscription;
};

interface BuyLicensesCart {
  customHeading?: string;
  basePlan: Plan;
  savingPlan?: Plan;
  defaultPlan?: Plan;
  subscription?: Subscription;
  paymentMethods?: OurPaymentMethod[];
  purchaseButtonCTAText?: string;
  hideQuantityPicker?: boolean;
  existingPaymentMethodsLoading?: boolean;
  onPlanSelect?: (plan: Plan) => void;
  onPurchase?: (purchaseRequest: PurchaseRequest) => Promise<void>;
  onPurchaseError?: (error: Error) => void;
  didPurchase?: (purchaseRequest: PurchaseRequest) => void;
}

const BuyLicensesCart: React.FC<BuyLicensesCart> = ({
  customHeading,
  basePlan,
  savingPlan,
  defaultPlan,
  subscription,
  paymentMethods = [],
  purchaseButtonCTAText = 'Buy',
  hideQuantityPicker = false,
  existingPaymentMethodsLoading = false,
  onPlanSelect = () => {
    /* do nothing */
  },
  onPurchase = async () => {
    /* do nothing */
  },
  onPurchaseError = () => {
    /* do nothing */
  },
  didPurchase = () => {
    /* do nothing */
  },
}) => {
  const [paymentMethodPayload, setPaymentMethodPayload] = useState<
    Payload | undefined
  >(
    subscription?.paymentMethod?.token
      ? { paymentMethodToken: subscription.paymentMethod.token }
      : undefined,
  );

  const [firstLoad, setFirstLoad] = useState<boolean>(true);
  const [quantityToAdd, setQuantityToAdd] = useState<number>(1);
  const [prorationDiscount, setProrationDiscount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const latestRequest = useRef<Promise<AxiosResponse> | undefined>();
  const [debouncedQuantityToAdd, setDebouncedQuantityToAdd] =
    useState<number>(quantityToAdd);
  const [requestCounter, setRequestCounter] = useState<number>(0);
  const [error, setError] = useState<Error | undefined>();
  const [selectedPlan, setSelectedPlan] = useState<Plan>(
    defaultPlan ?? basePlan ?? savingPlan,
  );

  const handleQuantityChange = (value: number) => {
    if (value < 10000) {
      setQuantityToAdd(Math.max(0, value));
    }
  };

  useEffect(() => {
    (async () => {
      if (subscription) {
        setIsLoading(true);

        const upgradeProrationRequest = upgradeProration(
          subscription.id,
          selectedPlan.id,
          (quantityToAdd || 1) + subscription.quantity,
        );

        /**
         * This helps us only grab the latest value incase the values arrive out of order.
         * TODO: Explore Redux-Saga or RTK Query to help with this kind of situation.
         * Redux-Saga: has a `takeLatest` and `takeEvery` method that allows you to take the latest or every value of concurrect requests
         * RTK-Query: By default it's async query takes the latest and there are ways of modifying this behaviour through the caching configuration
         */
        latestRequest.current = upgradeProrationRequest;

        const response = await upgradeProrationRequest;
        const thisIsTheLastRequest =
          latestRequest.current === upgradeProrationRequest;

        if (thisIsTheLastRequest) {
          if (response.data.asDiscount) {
            setRequestCounter((c) => c + 1);
            setProrationDiscount(response.data.asDiscount?.amount ?? 0);
          } else {
            setIsLoading(false);
            setProrationDiscount(0);
          }
        }
      } else {
        setDebouncedQuantityToAdd(quantityToAdd || 1);
        setRequestCounter((c) => c + 1);
      }
    })();

    setFirstLoad(false);
  }, [quantityToAdd, subscription, selectedPlan.id]);

  useEffect(() => {
    if (!firstLoad) {
      setIsLoading(false);
      setDebouncedQuantityToAdd(quantityToAdd);
    }

    // Disabling this because we want to use requestCounter turn off loading state, and debounce quantityToAdd
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestCounter]);

  return (
    <div className={css.innerContainer}>
      <div className={css.purchaseLicensesForm}>
        {customHeading && <h1 className={css.headingLarge}>{customHeading}</h1>}
        {!hideQuantityPicker && (
          <div>
            <h2 className={css.headingSmall}>
              {subscription ? 'Licenses to add' : 'Number of licenses'}
            </h2>
            <div className={css.quantityPicker}>
              <Button
                style="secondary"
                tone="base"
                size="large"
                onClick={() => handleQuantityChange(quantityToAdd - 1)}
                iconStartSvg={MinusIconSVG}
              />
              <TextInput
                type="number"
                value={valueToInput(quantityToAdd)}
                placeholder="1"
                onChange={(event) => {
                  const value = event.target.value;
                  handleQuantityChange(inputToValue(value));
                }}
                onKeyDown={(event) => {
                  if (['e', 'E', '-', '+', '.'].includes(event.key)) {
                    event.preventDefault();
                  }
                }}
              />
              <Button
                style="secondary"
                tone="base"
                size="large"
                onClick={() => handleQuantityChange(quantityToAdd + 1)}
                iconStartSvg={PlusIconSVG}
              />
            </div>
          </div>
        )}
        <div className={css.paymentMethodContainer}>
          <BuyPaymentMethodSelector
            existingPaymentMethodsLoading={existingPaymentMethodsLoading}
            defaultPaymentMethodToken={subscription?.paymentMethod?.token}
            paymentMethods={paymentMethods}
            onPaymentMethodChosen={(payload) =>
              setPaymentMethodPayload(payload)
            }
            onPaymentMethodCleared={() => {
              setPaymentMethodPayload(undefined);
            }}
          />
        </div>

        {paymentMethodPayload && (
          <Button
            style="primary"
            tone="green"
            size="large"
            disabled={!paymentMethodPayload}
            fullWidth
            isLoading={isPurchasing}
            onClick={async () => {
              setIsPurchasing(true);
              setError(undefined);

              try {
                const purchaseRequest: PurchaseRequest = {
                  plan: selectedPlan,
                  quantity: quantityToAdd,
                  existingSubscription: subscription,
                  paymentMethodPayload,
                };
                await onPurchase(purchaseRequest);
                didPurchase(purchaseRequest);
              } catch (e) {
                Tracking.trackEvent('Failed cart purchase', {
                  error,
                });
                setError(normalizeError(e));
                onPurchaseError(normalizeError(e));
              } finally {
                setIsPurchasing(false);
              }
            }}
          >
            {purchaseButtonCTAText}
          </Button>
        )}
        {error && (
          <div className={css.messageBoxContainer}>
            <MessageBanner title={error.message} type="error" />
          </div>
        )}
      </div>
      <div
        className={css.cartContainer}
        style={{
          opacity: !isLoading ? 1 : 0.5,
        }}
      >
        <BuyLicensesCartSummary
          basePlan={basePlan}
          savingPlan={savingPlan}
          defaultPlan={defaultPlan}
          existingSubscription={subscription}
          onPlanSelect={(plan) => {
            setSelectedPlan(plan);
            onPlanSelect(plan);
          }}
          additionalLineItems={
            prorationDiscount
              ? [
                  {
                    description: 'Proration Adjustment',
                    amount: prorationDiscount,
                    quantity: 1,
                  },
                ]
              : []
          }
          quantity={debouncedQuantityToAdd || 1}
        />
      </div>
    </div>
  );
};

export default BuyLicensesCart;
