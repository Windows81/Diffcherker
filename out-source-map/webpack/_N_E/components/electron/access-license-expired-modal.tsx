import ImageRetina from 'components/imageRetina';
import Modal from 'components/shared/modal';
import Tracking from 'lib/tracking';
import css from './access-license-expired-modal.module.css';
import Button from 'components/shared/button';
import ipcEvents from 'ipc-events';
import { LicenseState } from 'redux/modules/license-module';
import { useLogoutDesktop } from 'lib/state/license';

const modalContent: Record<
  'trial' | 'pro',
  {
    title: string;
    subtitle: string;
    buttonText: string;
    loginText: string;
    buttonEvent: {
      name: string;
      position: string;
      getUrl: (arg?: string) => string;
    };
  }
> = {
  trial: {
    title: 'Buy Diffchecker Desktop',
    subtitle: "This trial has expired and it's time to purchase your license!",
    buttonText: 'Buy Diffchecker Desktop',
    loginText:
      'If you already purchased a subscription under a different account,',
    buttonEvent: {
      name: 'Clicked purchase',
      position: 'trial-license-expired-modal',
      getUrl: (purchaseCode?: string) =>
        `https://www.diffchecker.com/buy-desktop?purchaseCode=${purchaseCode}&utm_source=diffchecker&utm_medium=diffchecker-desktop&utm_campaign=trial-expired-modal-upgrade`,
    },
  },
  pro: {
    title: 'Renew Diffchecker Desktop',
    subtitle: "This license has expired and it's time to extend your license!",
    buttonText: 'Extend license',
    loginText: 'If you purchased a subscription under a different account,',
    buttonEvent: {
      name: 'Clicked extend',
      position: 'pro-access-license-expired-modal',
      getUrl: () => 'https://www.diffchecker.com/account',
    },
  },
};

interface AccessLicenseExpiredModalProps {
  license: LicenseState;
}

const AccessLicenseExpiredModal: React.FC<AccessLicenseExpiredModalProps> = ({
  license: { isTrial, purchaseCode },
}) => {
  const logoutDesktop = useLogoutDesktop();

  const content = modalContent[isTrial ? 'trial' : 'pro'];
  const { title, subtitle, buttonText, loginText, buttonEvent } = content;

  const handleButtonClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    Tracking.trackEvent(buttonEvent.name, {
      position: buttonEvent.position,
    });
    window.ipcRenderer.send(
      ipcEvents.APP__OPEN_EXTERNAL_REQUESTED,
      buttonEvent.getUrl(purchaseCode),
    );
  };

  const handleLoginClick = (
    ev: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) => {
    ev.preventDefault();
    logoutDesktop();
  };

  return (
    <Modal isOpen={true} maxWidth="480px" noPadding noCloseButton>
      <div
        className={css.container}
        data-testid={
          isTrial ? 'trial-expired-modal' : 'pro-access-expired-modal'
        }
      >
        <div className={css.header}>
          <div className={css.title}>{title}</div>
          <span>{subtitle}</span>
        </div>

        <div className={css.image}>
          <ImageRetina
            src="diffchecker-screenshot"
            format="webp"
            alt="Diffchecker app on a mac computer"
          />
        </div>
      </div>

      <div className={css.bottom}>
        <Button
          style="primary"
          tone="green"
          size="xl"
          onClick={handleButtonClick}
        >
          {buttonText}
        </Button>

        <div className={css.login}>
          {loginText}{' '}
          <a href="" onClick={handleLoginClick}>
            log in here
          </a>
          .
        </div>
      </div>
    </Modal>
  );
};

export default AccessLicenseExpiredModal;
