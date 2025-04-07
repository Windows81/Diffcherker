import React, { useState, useEffect } from 'react';
import * as userSelector from 'redux/selectors/user-selector';

import Page from 'components/new/page';

import enableFullstory from 'lib/enable-fullstory';
import titleTemplate from 'lib/title-template';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { State, useAppSelector, useAppDispatch } from 'redux/store';

import css from './buy-page.module.css';
import BuyLicensesCart, { PurchaseRequest } from './licenses/cart';
import { Plan, isApiPlan } from 'lib/plans';
import * as PaymentsActions from 'redux/modules/payments-module';
import * as UserModel from 'models/user-model';

import Tracking from 'lib/tracking';
import { OurPaymentMethod } from 'types/payment-method';
import Logo from 'components/content-pages/logo';

interface BuyPageProps {
  basePlan: Plan;
  savingPlan?: Plan;
  defaultPlan?: Plan;
  pageName: string;
  customHeading?: string;
  homeRedirect?: string;
  paymentSuccessRoute: string;
  faq?: React.JSX.Element;
}

const BuyPage: React.FC<BuyPageProps> = ({
  basePlan,
  savingPlan,
  defaultPlan,
  pageName,
  customHeading,
  homeRedirect,
  paymentSuccessRoute,
}) => {
  const router = useRouter();
  const isLoggedIn = useAppSelector((state: State) =>
    userSelector.isLoggedIn(state),
  );
  const loggedInPaymentMethods = useAppSelector(
    (state: State) => state.payments.paymentMethods,
  );

  const [loadingPaymentMethods, setLoadingPaymentMethods] =
    useState<boolean>(false);
  const [paymentMethods, setPaymentMethods] = useState<OurPaymentMethod[]>(
    loggedInPaymentMethods,
  );
  const [selectedPlan, setSelectedPlan] = useState<Plan>(
    defaultPlan ?? basePlan ?? savingPlan,
  );

  const dispatch = useAppDispatch();
  const purchaseCode = router.query.purchaseCode
    ? `${router.query.purchaseCode}`
    : undefined;

  useEffect(() => {
    enableFullstory();
  }, []);

  // If you're not logged in and you're missing a purchase code, login, then go ahead.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!isLoggedIn && !purchaseCode) {
        router.push(`/login?next=${router.asPath}`);
      }
    }
  }, [isLoggedIn, router, purchaseCode]);

  // Get payment method for logged in user, or one with a purchase code
  useEffect(() => {
    const getUserFromPurcahseCode = async () => {
      if (purchaseCode && typeof purchaseCode === 'string') {
        try {
          setLoadingPaymentMethods(true);
          const response =
            await UserModel.getUserFromPurchaseCode(purchaseCode);
          setPaymentMethods(response.data.paymentMethods as OurPaymentMethod[]);
        } catch (error) {
          // If purchase code fails, and you're not logged in... well, let's get you logged in.
          if (!isLoggedIn) {
            router.push(`/login?next=${router.asPath}`);
            return;
          }
        } finally {
          setLoadingPaymentMethods(false);
        }
      }
    };

    const getOwnPaymentMethods = async () => {
      setLoadingPaymentMethods(true);
      await dispatch(PaymentsActions.getMyPaymentMethods()).unwrap();
      setLoadingPaymentMethods(false);
    };

    if (purchaseCode) {
      getUserFromPurcahseCode();
    } else if (isLoggedIn) {
      getOwnPaymentMethods();
    }
  }, [purchaseCode, isLoggedIn, dispatch, router]);

  useEffect(() => {
    setPaymentMethods(loggedInPaymentMethods);
  }, [loggedInPaymentMethods]);

  return (
    <Page
      title={titleTemplate(`Buy Diffchecker ${selectedPlan.marketingName}`)}
      metaDescription={`Buy Diffchecker ${selectedPlan.marketingName}`}
      name={pageName}
      hasHeader={false}
      fullWidth
    >
      <div className={css.wrapper}>
        <header className={css.navbar}>
          <div>
            <Link
              href={homeRedirect ?? '/'}
              className={css.logo}
              title="Diffchecker"
            >
              <Logo />
            </Link>
          </div>
        </header>

        <main className={css.main}>
          {!!basePlan && (
            <BuyLicensesCart
              customHeading={customHeading}
              basePlan={basePlan}
              savingPlan={savingPlan}
              defaultPlan={defaultPlan}
              hideQuantityPicker={isApiPlan(basePlan)}
              existingPaymentMethodsLoading={loadingPaymentMethods}
              onPlanSelect={setSelectedPlan}
              paymentMethods={paymentMethods}
              onPurchase={async (purchaseRequest: PurchaseRequest) => {
                Tracking.trackEvent('Tried paying', { plan: selectedPlan.id });
                await dispatch(
                  PaymentsActions.createSubscription({
                    planId: purchaseRequest.plan.id,
                    renewAutomatically: true,
                    purchaseCode,
                    quantity: purchaseRequest.quantity,
                    ...purchaseRequest.paymentMethodPayload,
                  }),
                ).unwrap();
              }}
              didPurchase={async (purchaseRequest) => {
                Tracking.trackEvent('Succeeded paying', {
                  plan: selectedPlan.id,
                  quantity: purchaseRequest.quantity,
                });

                router.push(paymentSuccessRoute);
              }}
              onPurchaseError={(error) => {
                Tracking.trackEvent('Failed paying', {
                  plan: selectedPlan.id,
                  error,
                });
              }}
            />
          )}
        </main>
      </div>
    </Page>
  );
};

export default BuyPage;
