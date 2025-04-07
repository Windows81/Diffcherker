import Modal from 'components/shared/modal';

import DesktopModalButtonsPro from './desktop-modal-buttons-pro';
import DesktopModalButtonsEnterprise from './desktop-modal-buttons-enterprise';
import css from './desktop-modal.module.css';
import Logo from 'components/content-pages/logo';
import Plans from 'components/content-pages/plans';

interface DesktopModalProps {
  isOpen: boolean;
  closeModal: () => void;
}

const DesktopModal: React.FC<DesktopModalProps> = ({ isOpen, closeModal }) => {
  return (
    <Modal isOpen={isOpen} closeModal={closeModal} maxWidth="1080px" noPadding>
      <div className={css.container}>
        <div className={css.header}>
          <p className={css.headerLabel}>
            To continue using this feature, upgrade to
          </p>
          <Logo isLarge label="Pro" isLabelGreen />
        </div>
        <Plans
          billing="yearly"
          actionsPro={<DesktopModalButtonsPro closeModal={closeModal} />}
          actionsEnterprise={
            <DesktopModalButtonsEnterprise closeModal={closeModal} />
          }
        />
      </div>
    </Modal>
  );
};

export default DesktopModal;
