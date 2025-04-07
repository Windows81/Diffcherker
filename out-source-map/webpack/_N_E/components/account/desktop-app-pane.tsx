import Button from 'components/shared/button';
import DownloadSvg from 'components/shared/icons/download.svg';

import css from './desktop-app-pane.module.css';

interface AccountDesktopAppPaneProps {
  onDownloadDesktopApp?: () => void;
}

export const AccountDesktopAppPane: React.FC<AccountDesktopAppPaneProps> = ({
  onDownloadDesktopApp,
}) => {
  return (
    <div className={css.accountDesktopAppPane}>
      <h2 className={css.accountDesktopAppPaneHeader}>Desktop App</h2>
      <p className={css.accountDesktopAppPaneInfo}>
        Download and open the Diffchecker Desktop app to manage its settings.
      </p>
      <div>
        <Button
          href="/download-diffchecker"
          iconStartSvg={DownloadSvg}
          style="secondary"
          tone="base"
          onClick={onDownloadDesktopApp}
        >
          Download Desktop App
        </Button>
      </div>
    </div>
  );
};
