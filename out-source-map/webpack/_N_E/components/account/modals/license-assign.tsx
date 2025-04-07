import * as React from 'react';
import createWebUrl from 'lib/create-web-url';

import Modal from 'components/shared/modal';
import css from './license-assign.module.css';
import CopyReadonly from 'components/new/copy-readonly';

interface AccountModalsLicenseAssignProps {
  isOpen: boolean;
  closeModal: () => void;
  licenseKey: string;
}

const AccountModalsLicenseAssign: React.FC<AccountModalsLicenseAssignProps> = (
  props,
) => {
  const { isOpen, closeModal, licenseKey } = props;
  return (
    <Modal isOpen={isOpen} closeModal={closeModal} maxWidth="650px">
      <div className={css.container}>
        <h2 className={css.heading}>Assign License</h2>
        <p>
          Send them the link and ask them to either login or signup. <br /> Once
          logged in the license will be assigned to their account automatically
        </p>
        <CopyReadonly value={createWebUrl(`/license/assign/${licenseKey}`)} />
      </div>

      <div className="modal-footer" />
    </Modal>
  );
};

export default AccountModalsLicenseAssign;
