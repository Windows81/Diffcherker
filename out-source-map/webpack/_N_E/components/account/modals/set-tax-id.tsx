import * as React from 'react';
import * as UserActions from 'redux/modules/user-module';
import getNetworkErrorCode from 'lib/get-network-error-code';
import Tracking from 'lib/tracking';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { type State, useAppDispatch } from 'redux/store';

import Button from 'components/shared/button';
import Modal from 'components/shared/modal';
import css from './set-tax-id.module.css';
import MessageBanner from 'components/shared/message-banner';
import { getErrorByCode } from 'lib/messages';
import TextInput from 'components/shared/form/text-input';

interface SetTaxIdModalProps {
  closeModal: () => void;
  isOpen: boolean;
}

type Status =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success' }
  | { type: 'error'; code: string };

const AccountModalsSetTaxId: React.FC<SetTaxIdModalProps> = (props) => {
  const { closeModal, isOpen } = props;
  const [status, setStatus] = useState<Status>({ type: 'idle' });
  const taxIdRef = useRef<HTMLInputElement>(null);

  const dispatch = useAppDispatch();
  const user = useSelector((state: State) => state.user.user);
  const handleSetTaxIdSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const taxId = taxIdRef.current?.value;
    if (!user || !taxId) {
      return;
    }
    setStatus({ type: 'loading' });
    try {
      await dispatch(UserActions.setTaxId(taxId)).unwrap();
      Tracking.trackEvent('Set tax ID');
    } catch (error) {
      setStatus({ type: 'error', code: getNetworkErrorCode(error) });
    }
    setStatus({ type: 'success' });
    closeModal();
  };

  useEffect(() => {
    if (isOpen) {
      setStatus({ type: 'idle' });
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} minWidth="280px">
      <div className={css.container}>
        <h2 className={css.heading}>Set Tax ID</h2>
        <form className={css.taxIdForm} onSubmit={handleSetTaxIdSubmit}>
          {status.type === 'error' && (
            <MessageBanner title={getErrorByCode(status.code)} type="error" />
          )}
          {status.type !== 'success' && (
            <>
              <TextInput
                className={css.emailInput}
                type="text"
                ref={taxIdRef}
                name="taxId"
                placeholder="Tax ID"
                required
              />
              <Button
                style="primary"
                tone="green"
                size="large"
                type="submit"
                fullWidth
              >
                Set Tax ID
              </Button>
            </>
          )}
          {status.type === 'loading' && <div className="loading inline" />}
        </form>
      </div>
    </Modal>
  );
};

export default AccountModalsSetTaxId;
