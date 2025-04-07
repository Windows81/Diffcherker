import * as React from 'react';

import Modal from 'components/shared/modal';
import { Subscription } from 'types/subscription';
import css from './remove-payment-method.module.css';
import Button from 'components/shared/button';
import * as PaymentsActions from 'redux/modules/payments-module';
import { useAppDispatch } from 'redux/store';
import Tracking from 'lib/tracking';

interface AccountModalsRemovePaymentMethodProps {
  isOpen: boolean;
  closeModal: () => void;
  onRemove: (subscription: Subscription | null) => void;
  onCancel: (subscription: Subscription | null) => void;
  subscription: Subscription | null;
}

const AccountModalsRemovePaymentMethod: React.FC<
  AccountModalsRemovePaymentMethodProps
> = ({ isOpen, closeModal, onRemove, onCancel, subscription }) => {
  const dispatch = useAppDispatch();
  const [isRemoving, setIsRemoving] = React.useState<boolean>(false);

  const handleRemovePaymentMethod = async () => {
    if (subscription) {
      setIsRemoving(true);
      await dispatch(
        PaymentsActions.deletePaymentMethodForSubscription(subscription.id),
      ).unwrap();
      Tracking.trackEvent('Removed payment method');
      setIsRemoving(false);
      onRemove(subscription);
    }
  };
  return (
    <Modal isOpen={isOpen} maxWidth="392px" noCloseButton>
      <h1 className={css.header}>Remove payment method</h1>
      <p className={css.p}>
        Are you sure that you want to remove the payment method{' '}
        {subscription?.paymentMethod?.cardType}{' '}
        {subscription?.paymentMethod?.type === 'card'
          ? `•••• ${subscription?.paymentMethod.last4}`
          : `${subscription?.paymentMethod?.email}`}{' '}
        from your subscription?
      </p>
      <p className={css.p}>
        Your subscription will no longer be able to renew.
      </p>
      <div className={css.buttons}>
        <Button
          style="secondary"
          tone="base"
          size="large"
          fullWidth
          onClick={() => {
            onCancel(subscription);
            closeModal();
          }}
        >
          Cancel
        </Button>
        <Button
          style="primary"
          tone="red"
          size="large"
          fullWidth
          isLoading={isRemoving}
          onClick={handleRemovePaymentMethod}
        >
          Remove
        </Button>
      </div>
    </Modal>
  );
};

export default AccountModalsRemovePaymentMethod;
