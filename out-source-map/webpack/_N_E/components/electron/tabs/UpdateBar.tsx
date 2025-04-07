import * as React from 'react';
import {
  useAutoUpdateInstallAndRestart,
  useAutoUpdateStartDownload,
  useAutoUpdatesValue,
  useRequestAutoUpdate,
} from '../../../lib/state/autoUpdate';
import { useIsLicenseExpired } from 'lib/state/license';
import * as electron from '../../../lib/state/electron';
import Button from 'components/shared/button';
import LoadingCircle from '../../shared/loaders/loading-circle';
import css from './UpdateBar.module.css';
import { IpcRendererEvent } from 'electron';
import ipcEvents from '../../../ipc-events';
import Tracking from 'lib/tracking';
import yn from 'yn';
import type { UpdateInfo } from 'builder-util-runtime';

export const STATUS = {
  INIT: 'init',
  CHECKING_FOR_UPDATE: 'checking for update',
  UPDATE_AVAILABLE: 'update available',
  UPDATE_NOT_AVAILABLE: 'update not available',
  ERROR: 'error',
  DOWNLOAD_PROGRESS: 'download progress',
  UPDATE_DOWNLOADED: 'update downloaded',
};

const UpdateBar = () => {
  const installAndRestart = useAutoUpdateInstallAndRestart();
  const startDownload = useAutoUpdateStartDownload();
  const [downloadPercentage, setDownloadPercentage] = React.useState<number>(0);
  const [status, setStatus] = React.useState(STATUS.INIT);
  const [appVersion, setAppVersion] = React.useState<
    string | undefined | null
  >();
  const autoUpdates = useAutoUpdatesValue();
  const requestAutoUpdate = useRequestAutoUpdate();
  const isExpired = useIsLicenseExpired();

  const handleError = (_event: IpcRendererEvent, error: unknown) => {
    setStatus(STATUS.ERROR);
    Tracking.trackEvent('Error updating desktop application', {
      error: error,
    });
  };

  const handleStartDownload = () => {
    startDownload();
  };

  const handleDownloadProgress = (
    _event: IpcRendererEvent,
    percent: number,
  ) => {
    setStatus(STATUS.DOWNLOAD_PROGRESS);
    setDownloadPercentage(Math.round(percent));
  };

  const handleUpdateDownloaded = (_event: IpcRendererEvent) => {
    setStatus(STATUS.UPDATE_DOWNLOADED);
  };

  const handleUpdateAvailable = (
    _event: IpcRendererEvent,
    updateInfo: UpdateInfo,
  ) => {
    setAppVersion(updateInfo.version);
    setStatus(STATUS.UPDATE_AVAILABLE);
  };

  React.useEffect(() => {
    const unsubscribeCallbacks: Array<(() => unknown) | undefined> = [];

    // setup ipc events.
    unsubscribeCallbacks.push(
      electron.on(ipcEvents.UPDATE__UPDATE_AVAILABLE, handleUpdateAvailable),
    );
    unsubscribeCallbacks.push(
      electron.on(ipcEvents.UPDATE__DOWNLOAD_PROGRESS, handleDownloadProgress),
    );
    unsubscribeCallbacks.push(
      electron.on(ipcEvents.UPDATE__UPDATE_DOWNLOADED, handleUpdateDownloaded),
    );
    unsubscribeCallbacks.push(
      electron.on(ipcEvents.UPDATE__ERROR, handleError),
    );

    // Request an auto update
    if (!isExpired && !yn(process.env.OFFLINE_BUILD)) {
      requestAutoUpdate();
    }

    return () => {
      unsubscribeCallbacks.forEach((unsubscribe) => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If autoupdates is set to true, then don't render the update bar.
  if (autoUpdates) {
    return null;
  }

  let content: JSX.Element | null = null;
  switch (status) {
    case STATUS.UPDATE_AVAILABLE:
      content = (
        <Button style="primary" tone={'green'} onClick={handleStartDownload}>
          Update to v{appVersion}
        </Button>
      );
      break;
    case STATUS.DOWNLOAD_PROGRESS:
      content = (
        <div className={css.updateBar}>
          <span> {`${downloadPercentage}%`} </span>
          <LoadingCircle size="xs" progress={downloadPercentage / 100} />
        </div>
      );
      break;
    case STATUS.UPDATE_DOWNLOADED:
      content = (
        <Button style="primary" tone={'green'} onClick={installAndRestart}>
          Install and restart
        </Button>
      );
    default:
      break;
  }
  return content;
};

export default React.memo(UpdateBar);
