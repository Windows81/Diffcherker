import Button from 'components/shared/button';
import Modal from 'components/shared/modal';
import { differenceInHours } from 'date-fns';
import { getItem, setItem } from 'lib/local-storage';
import Tracking from 'lib/tracking';
import { useEffect, useState, useRef } from 'react';
import { State, useAppSelector } from 'redux/store';
import ModalDesktopFeatures from 'components/new/modal-desktop-features';
import css from './license-expired-modal.module.css';

const EXPIRY_DUE_TIME = 5 * 24; // 5 days * 24 hours

const LicenseExpiredModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isExpired = useRef(false);
  const license = useAppSelector((state: State) => state.user?.user?.license);

  useEffect(() => {
    // Only show if license exists
    if (license) {
      const seenModal = getItem('alreadySawLicenseModal');
      // have not seen modal
      if (seenModal === null) {
        // Expired or not Expired?
        const currentDate = new Date();
        // exspiresAt field not nullable in backend license type
        const expiryDate = new Date(license.expiresAt);
        if (license.isExpired) {
          isExpired.current = true;
          setIsOpen(true);
        } else if (license.isTrial) {
          // Two cases -> within 5 days of expiry, or more than 5 days of expiry
          const timeDiff = differenceInHours(expiryDate, currentDate);
          if (timeDiff <= EXPIRY_DUE_TIME) {
            setIsOpen(true);
          }
        }
      }
    }
  }, [license]);

  const trackGetClick = (): void => {
    Tracking.trackEvent('Clicked compare plans', {
      position: 'license-expired-modal',
    });
    closeModal();
  };

  const closeModal = (): void => {
    setIsOpen(false);
    setItem('alreadySawLicenseModal', 'true');
  };

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} maxWidth="590px" noPadding>
      <div className={css.mainContent}>
        <h2 className={css.title}>
          {isExpired.current
            ? 'Your Diffchecker Pro + Desktop license has expired'
            : 'Your Diffchecker Pro + Desktop license is due to expire'}
        </h2>
        <div className={css.subtitle}>
          Get a license of Diffchecker Pro + Desktop to continue using all of
          its features:
        </div>
        <ModalDesktopFeatures />
      </div>
      <div className={css.footer}>
        <div className={css.planDetails}>
          <span className={css.mainDetail}>
            Diffchecker Pro + Desktop starts at
          </span>
          <span className={css.emphasis}>$15</span>
          <span className={css.detail}>/ month</span>
        </div>
        <div className={css.buttons}>
          <Button
            style="secondary"
            tone="base"
            size="large"
            fullWidth
            onClick={closeModal}
            className={css.button}
          >
            Continue with free version
          </Button>

          <Button
            style="primary"
            tone="green"
            size="large"
            fullWidth
            href="/pricing"
            className={css.button}
            onClick={trackGetClick}
            nextLink
          >
            Compare plans
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default LicenseExpiredModal;
