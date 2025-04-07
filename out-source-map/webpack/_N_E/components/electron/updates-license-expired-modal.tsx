import { useState } from 'react';
import Modal from 'components/shared/modal';
import css from './updates-license-expired-modal.module.css';
import Button from 'components/shared/button';
import Tracking from 'lib/tracking';
import ipcEvents from 'ipc-events';
import { useDisableLicenseModal, useLogoutDesktop } from 'lib/state/license';

const UpdatesLicenseExpiredModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const logoutDesktop = useLogoutDesktop();
  const [disableLicenseModal, setDisableLicenseModal] =
    useDisableLicenseModal();

  const closeModal = () => {
    setDisableLicenseModal(true);
    setIsOpen(false);
  };

  const handleLogOutClick = () => {
    logoutDesktop();
  };

  const handleExtendClick = (ev: React.MouseEvent<HTMLButtonElement>) => {
    ev.preventDefault();
    Tracking.trackEvent('Clicked extend', {
      position: 'paid-license-expired-modal',
    });
    window.ipcRenderer.send(
      ipcEvents.APP__OPEN_EXTERNAL_REQUESTED,
      'https://www.diffchecker.com/account',
    );
  };

  if (disableLicenseModal) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      closeModal={closeModal}
      title="Your license has expired"
      maxWidth="450px"
    >
      <div className={css.content} data-testid="pro-updates-expired-modal">
        <span>
          You are still free to use the app, but you won&apos;t receive updates.
          <br />
          In order to keep your app up-to-date, please extend your license.
        </span>
        <div className={css.buttons}>
          <Button
            style="text"
            tone="base"
            size="xl"
            onClick={handleLogOutClick}
          >
            Log out
          </Button>

          <Button
            style="secondary"
            tone="base"
            size="xl"
            onClick={handleExtendClick}
          >
            Extend license
          </Button>

          <Button style="primary" tone="green" size="xl" onClick={closeModal}>
            Continue to app
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UpdatesLicenseExpiredModal;
