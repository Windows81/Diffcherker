import * as React from 'react';

import Button from 'components/shared/button';
import css from './cancel.module.css';
import Modal from 'components/shared/modal';
import { Subscription } from 'types/subscription';
import { useState } from 'react';
import MessageBanner from 'components/shared/message-banner';
import { addDays, format } from 'date-fns';

interface AccountModalsCancelProps {
  subscription?: Subscription | null;
  onConfirmCancel: (subscription: Subscription) => void;
  onAbortCancel: (subscription: Subscription) => void;
  closeModal?: () => void;
  isOpen?: boolean;
}

const AccountModalsCancel: React.FC<AccountModalsCancelProps> = ({
  subscription,
  onConfirmCancel,
  onAbortCancel,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  closeModal = () => {},
  isOpen = false,
}) => {
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} maxWidth="392px">
      <div className={css.container}>
        <h2 className={css.header}>Cancel subscription</h2>
        <p className={css.p}>
          Are you sure that you want cancel your subscription?
        </p>
        <p className={css.p}>
          This action will delete your subscription at the{' '}
          <strong className={css.strong}>end of the billing cycle</strong>.
        </p>
        <p className={css.p}>
          You will lose access to{' '}
          <strong className={css.strong}>all premium features</strong> of
          Diffchecker including the desktop app on{' '}
          <strong className={css.strong}>
            {format(
              addDays(
                subscription
                  ? new Date(subscription.paidThroughDate)
                  : new Date(),
                1,
              ),
              'MMMM do yyyy',
            )}
          </strong>
          .
        </p>
        {error && (
          <div className={css.messageBoxContainer}>
            <MessageBanner title={error.message} type="error" />
          </div>
        )}
        <div className={css.buttons}>
          <Button
            style="primary"
            tone="red"
            size="large"
            fullWidth
            isLoading={isCancelling}
            onClick={async () => {
              if (!subscription) {
                return;
              }

              setIsCancelling(true);
              try {
                await onConfirmCancel(subscription);
              } catch (e) {
                if (e instanceof Error) {
                  setError(e);
                } else {
                  console.error(e);
                }
              } finally {
                setIsCancelling(false);
              }
            }}
          >
            Cancel subscription
          </Button>
          <Button
            style="secondary"
            tone="base"
            size="large"
            fullWidth
            onClick={() => {
              if (!subscription) {
                closeModal();
                return;
              }

              onAbortCancel(subscription);
              closeModal();
            }}
          >
            Abort
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AccountModalsCancel;
