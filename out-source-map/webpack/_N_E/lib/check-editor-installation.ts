import { captureException } from '@sentry/browser';
import Tracking from './tracking';
import ipcEvents from 'ipc-events';

export const isMicrosoftWordInstalled = async (): Promise<boolean> => {
  const ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;
  try {
    return await ipcRenderer.invoke(ipcEvents.APP__HAS_WORD);
  } catch (err) {
    captureException(err, {
      tags: {
        action: 'checkMicrosoftWordInstallation',
      },
    });
    Tracking.trackEvent('Failed to check Microsoft Word installation');
  }
  return false;
};

export const isMicrosoftWordInstalledMac = async (): Promise<boolean> => {
  const ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;
  try {
    return await ipcRenderer.invoke(ipcEvents.APP__HAS_WORD_MAC);
  } catch (err) {
    captureException(err, {
      tags: {
        action: 'checkMicrosoftWordInstallationMac',
      },
    });
    Tracking.trackEvent('Failed to check Microsoft Word installation on Mac');
  }
  return false;
};

export const isPagesInstalledMac = async (): Promise<boolean> => {
  const ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;
  try {
    return await ipcRenderer.invoke(ipcEvents.APP__HAS_PAGES);
  } catch (err) {
    captureException(err, {
      tags: {
        action: 'checkPagesInstallation',
      },
    });
    Tracking.trackEvent('Failed to check Pages installation');
  }
  return false;
};
