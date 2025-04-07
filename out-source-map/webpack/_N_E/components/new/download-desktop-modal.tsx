import Modal from 'components/shared/modal';
import css from './download-desktop-modal.module.css';
import ImageRetina from 'components/imageRetina';
import Button from 'components/shared/button';
import Tracking from 'lib/tracking';
import ModalDesktopFeatures from './modal-desktop-features';
import { TRIAL_LENGTH_IN_DAYS } from 'types/constants';

interface DownloadDesktopModalProps {
  isOpen: boolean;
  closeModal: () => void;
  type: 'trial' | 'signed up';
}

const DownloadDesktopModal: React.FC<DownloadDesktopModalProps> = ({
  isOpen,
  closeModal,
  type,
}) => {
  const trackGetClick = (): void => {
    Tracking.trackEvent('Clicked get diffchecker', {
      type: 'trial',
      position: type === 'trial' ? 'trial-modal' : 'signed-up-modal',
    });
  };

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} maxWidth="590px" noPadding>
      <div className={css.mainContent}>
        <div className={css.header}>
          <div className={css.subtitle}>
            {type === 'trial'
              ? `Your ${TRIAL_LENGTH_IN_DAYS} day trial of Diffchecker Pro has begun!`
              : 'You are now signed up!'}
          </div>
          <div className={css.title}>Download Diffchecker Desktop</div>
        </div>
        <ModalDesktopFeatures />
        <div className={css.imageSection}>
          <ImageRetina
            src="diffchecker-screenshot-2"
            alt="Diffchecker app on a mac computer"
          />
        </div>
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
          Use web version instead
        </Button>

        <Button
          style="primary"
          tone="green"
          size="large"
          fullWidth
          href="/download-trial"
          className={css.button}
          onClick={trackGetClick}
          nextLink
        >
          Download Diffchecker Desktop
        </Button>
      </div>
    </Modal>
  );
};

export default DownloadDesktopModal;
