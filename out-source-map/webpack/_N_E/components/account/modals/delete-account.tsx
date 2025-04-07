import * as React from 'react';

import Button from 'components/shared/button';
import css from './delete-account.module.css';
import Modal from 'components/shared/modal';
import { Subscription } from 'types/subscription';
import { useState } from 'react';
import MessageBanner from 'components/shared/message-banner';
import TextInput from 'components/shared/form/text-input';
import { normalizeError } from 'lib/messages';
import Tracking from 'lib/tracking';

interface AccountModalsDeleteProps {
  subscription?: Subscription | null;
  onConfirmDelete: () => Promise<void>;
  onAbortDelete?: () => void;
  closeModal: () => void;
  isOpen?: boolean;
}

const AccountModalsDeleteAccount: React.FC<AccountModalsDeleteProps> = ({
  onConfirmDelete,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onAbortDelete = () => {},
  closeModal,
  isOpen = false,
}) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [deleteStatement, setDeleteStatement] = useState<string>('');

  return (
    <Modal isOpen={isOpen} noCloseButton maxWidth="392px">
      <div className={css.container}>
        <h2 className={css.header}>Delete account</h2>
        <p className={css.p}>Are you sure that you want delete your account?</p>
        <p className={css.p}>
          This action will delete your account, including any subscriptions and
          all saved diffs <strong>permanently!</strong>
        </p>
        <p className={css.p}>
          To confirm please type <strong>DELETE MY ACCOUNT</strong> in all caps.
        </p>
        <p className={css.p}>
          <strong>CONFIRM</strong>
          <br />
          <TextInput
            value={deleteStatement}
            onInput={(event) => setDeleteStatement(event.currentTarget.value)}
          />
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
            isLoading={isDeleting}
            onClick={async () => {
              if (!deleteStatement) {
                return;
              }

              setIsDeleting(true);

              if (deleteStatement !== 'DELETE MY ACCOUNT') {
                setError(
                  new Error(
                    'Statement does not match "DELETE MY ACCOUNT", please try again.',
                  ),
                );
                setIsDeleting(false);
                return;
              }

              try {
                await onConfirmDelete();
                Tracking.trackEvent('Deleted account');
              } catch (e) {
                setError(normalizeError(e));
              } finally {
                setIsDeleting(false);
              }
            }}
          >
            Delete account
          </Button>
          <Button
            style="secondary"
            tone="base"
            size="large"
            fullWidth
            onClick={() => {
              onAbortDelete();
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

export default AccountModalsDeleteAccount;
