import * as React from 'react';
import * as LicenseActions from 'redux/modules/license-module';

import Modal from 'components/shared/modal';
import css from './license-assign.module.css';
import Button from 'components/shared/button';
import { useAppDispatch } from 'redux/store';
import { License } from 'types/license';
import Tracking from 'lib/tracking';

interface AccountModalsLicenseUnassignProps {
  isOpen: boolean;
  closeModal: () => void;
  license?: License | null;
}

const AccountModalsLicenseUnassign: React.FC<
  AccountModalsLicenseUnassignProps
> = (props) => {
  const { isOpen, closeModal, license } = props;

  const dispatch = useAppDispatch();
  const handleClickUnassign = async () => {
    // Likely a guard against multiple clicks
    if (!isOpen || !license?.id) {
      return;
    }

    await dispatch(LicenseActions.unassignLicense(license.id)).unwrap();
    Tracking.trackEvent('Unassigned license key');
    closeModal();
  };

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} maxWidth="650px">
      <div className={css.container}>
        <h2 className={css.heading}>
          Are you sure you want to un-assign this license key?
        </h2>
        <p>
          Any users using this license key will be logged out of Diffchecker
          Desktop and the license key will be regenerated.
        </p>
        <div className={css.buttons}>
          <Button
            className={css.unassignButton}
            style="primary"
            tone="red"
            size="large"
            onClick={handleClickUnassign}
          >
            Unassign license
          </Button>
          <br />
          <Button style="text" tone="base" onClick={closeModal}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AccountModalsLicenseUnassign;
