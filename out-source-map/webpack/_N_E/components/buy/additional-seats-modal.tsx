import * as React from 'react';

import Modal, { makeStateless } from 'components/shared/modal';
import css from './additional-seats-modal.module.css';
import BuyLicensesCart from './licenses/cart';
import { OurPaymentMethod } from 'types/payment-method';
import { Subscription } from 'types/subscription';
import * as PaymentsModule from 'redux/modules/payments-module';
import { useAppDispatch } from 'redux/store';
import { PlanLookup } from 'lib/plans';

interface BuyAdditionalSeatsModalProps {
  isOpen: boolean;
  paymentMethods: OurPaymentMethod[];
  closeModal: () => void;
  didClose: () => void;
  subscription: Subscription;
}

const BuyAdditionalSeatsModal: React.FC<BuyAdditionalSeatsModalProps> = (
  props,
) => {
  const {
    isOpen,
    closeModal,
    didClose,
    subscription,
    paymentMethods = [],
  } = props;

  const dispatch = useAppDispatch();

  return (
    <Modal
      isOpen={isOpen}
      closeModal={closeModal}
      didClose={didClose}
      minWidth="759px"
    >
      <div className={css.container}>
        <h2 className={css.heading}>Transaction details</h2>
        <BuyLicensesCart
          basePlan={PlanLookup[subscription.planId]}
          subscription={subscription}
          paymentMethods={paymentMethods}
          onPurchase={async (paymentMethodRequest) => {
            await dispatch(
              PaymentsModule.addLicenses({
                subscriptionId: subscription.id,
                quantity: paymentMethodRequest.quantity,
                method: paymentMethodRequest.paymentMethodPayload,
              }),
            ).unwrap();
          }}
          didPurchase={() => {
            closeModal();
          }}
        />
      </div>
    </Modal>
  );
};

export default makeStateless(BuyAdditionalSeatsModal);
