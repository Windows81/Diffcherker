import * as React from 'react';
import * as UserActions from 'redux/modules/user-module';
import getNetworkErrorCode from 'lib/get-network-error-code';
import Tracking from 'lib/tracking';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { type State, useAppDispatch } from 'redux/store';

import Button from 'components/shared/button';
import css from './change-email.module.css';
import Modal from 'components/shared/modal';
import { getErrorByCode } from 'lib/messages';
import MessageBanner from 'components/shared/message-banner';
import TextInput from 'components/shared/form/text-input';

interface ChangeEmailModalProps {
  closeModal: () => void;
  isOpen: boolean;
}

type Status =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success' }
  | { type: 'error'; code: string };

const AccountModalsChangeEmail: React.FC<ChangeEmailModalProps> = ({
  closeModal,
  isOpen,
}) => {
  const [status, setStatus] = useState<Status>({ type: 'idle' });
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const user = useSelector((state: State) => state.user.user);
  const handleChangeEmailSubmit = async (
    ev: React.FormEvent<HTMLFormElement>,
  ) => {
    ev.preventDefault();
    const email = emailRef.current?.value;
    const password = passwordRef.current?.value;
    if (!user || !email || !password) {
      return;
    }
    setStatus({ type: 'loading' });
    try {
      await dispatch(
        UserActions.changeEmail({
          password,
          email,
        }),
      ).unwrap();
      setStatus({ type: 'success' });
      Tracking.trackEvent('Changed email');
    } catch (error) {
      setStatus({
        type: 'error',
        code: getNetworkErrorCode(error),
      });
    }
  };
  useEffect(() => {
    if (isOpen) {
      setStatus({ type: 'idle' });
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} maxWidth="685px">
      <div className={css.container}>
        <h2 className={css.changeEmailHeader}>Change Email Address</h2>
        <form
          className={css.changeEmailForm}
          onSubmit={handleChangeEmailSubmit}
        >
          {status.type === 'success' && (
            <>
              <div className={css.messageBoxContainer}>
                <MessageBanner
                  title="Verification email has been sent - please check your mailbox."
                  type="success"
                />
              </div>
              <Button style="secondary" tone="base" onClick={closeModal}>
                Close
              </Button>
            </>
          )}
          {status.type !== 'success' && (
            <>
              <span>
                You will be sent a verification email to the new address. Please
                re-enter your password for security purposes:
              </span>
              <TextInput
                className={css.changeEmailInput}
                type="email"
                ref={emailRef}
                name="email"
                placeholder="New email address"
                required
              />
              <TextInput
                className={css.changeEmailInput}
                type="password"
                ref={passwordRef}
                name="password"
                placeholder="Your account password"
                required
              />

              {status.type === 'error' && (
                <div className={css.messageBoxContainer}>
                  <MessageBanner
                    title={getErrorByCode(status.code)}
                    type="error"
                  />
                </div>
              )}

              <Button
                style="primary"
                tone="green"
                size="large"
                type="submit"
                fullWidth
                isLoading={status.type === 'loading'}
              >
                Change email
              </Button>
            </>
          )}
          {status.type === 'loading' && <div className="loading inline" />}
        </form>
      </div>
    </Modal>
  );
};

export default AccountModalsChangeEmail;
