import Modal from 'components/shared/modal';
import css from './homepage-modal.module.css';
import Logo from 'components/content-pages/logo';
import Mockup from 'components/content-pages/mockup';
import HomepageModalButtons from './homepage-modal-buttons';

interface DesktopModalProps {
  isOpen: boolean;
  closeModal: () => void;
}

const DesktopModal: React.FC<DesktopModalProps> = ({ isOpen, closeModal }) => {
  return (
    <Modal isOpen={isOpen} closeModal={closeModal} maxWidth="864px" noPadding>
      <div className={css.wrapper}>
        <header className={css.header}>
          <p className={css.upperLogoText}>This feature is only available on</p>
          <Logo isLarge label="Desktop" isLabelGreen />
        </header>
        <div className={css.mockupWrapper}>
          <div className={css.mockup}>
            <Mockup type="folder-large" showMenubar />
          </div>
        </div>

        <HomepageModalButtons position="folder-diff" />
      </div>
    </Modal>
  );
};

export default DesktopModal;
