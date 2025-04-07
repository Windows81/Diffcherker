import Modal from 'components/shared/modal';
import { getItem, setItem } from 'lib/local-storage';
import Tracking from 'lib/tracking';
import { useEffect, useState } from 'react';
import HomepageModalButtons from './homepage-modal-buttons';
import css from './homepage-modal.module.css';
import Mockup from 'components/content-pages/mockup';
import Logo from 'components/content-pages/logo';

const POSITION = 'homepage-modal';

const HomepageModal: React.FC = () => {
  const [alreadySawHomepageModal, setAlreadySawHomepageModal] = useState(true);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const alreadySawHomepageModal = !!getItem('alreadySawHomepageModal');
    setAlreadySawHomepageModal(alreadySawHomepageModal);
    setRendered(true);
  }, []);

  const handleHomepageModalClose = () => {
    setAlreadySawHomepageModal(true);
    setItem('alreadySawHomepageModal', 'true');
  };

  const screenWideEnough =
    typeof window !== 'undefined' && window.innerWidth > 700;

  if (screenWideEnough && !alreadySawHomepageModal && rendered) {
    return (
      <HomepageModalContent
        isOpen={!alreadySawHomepageModal}
        closeModal={handleHomepageModalClose}
      />
    );
  }

  return <></>;
};

interface HomepageModalContentProps {
  isOpen: boolean;
  closeModal: () => void;
}

const HomepageModalContent: React.FC<HomepageModalContentProps> = ({
  isOpen,
  closeModal,
}) => {
  useEffect(() => {
    Tracking.trackEvent('Saw homepage modal');
    setItem('alreadySawHomepageModal', 'true');
  }, []);

  const handleClickNotNow = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    ev.preventDefault();
    Tracking.trackEvent('Clicked not now', { position: POSITION });
    closeModal();
  };

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} maxWidth="864px" noPadding>
      <div className={css.wrapper}>
        <header className={css.header}>
          <p className={css.upperLogoText}>Check out</p>
          <Logo label="Desktop" isLabelGreen isLarge />
          <p className={css.bottomLogoText}>
            Get the Diffchecker experience on your desktop. No ads, offline
            diffs and even more advanced features!
          </p>
        </header>

        <div className={css.mockupWrapper}>
          <div className={css.mockup}>
            <Mockup type="text" showMenubar />
          </div>
        </div>

        <HomepageModalButtons position={POSITION} />

        <div className={css.bottomLink}>
          {/* TODO figure out if there was a reason for anchor tag or if I can just use a button */}
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a href="#" onClick={handleClickNotNow}>
            Use web version instead
          </a>
        </div>
      </div>
    </Modal>
  );
};

export default HomepageModal;
