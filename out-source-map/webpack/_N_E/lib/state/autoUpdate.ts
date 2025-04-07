// import * as React from 'react';
import { atom, useAtom, useAtomValue } from 'jotai';
import * as electron from './electron';
import ipcEvents from '../../ipc-events';

export interface AutoUpdateState {
  checkingForUpdates?: boolean;
  downloadProgress?: number | null;
  readyToInstall?: boolean;
  lastCheckedAt?: string | null;
  hasUpdate?: boolean;
  nextVersion?: string | null;
  error?: string | null;
}

const autoUpdateInternalAtom = atom(
  electron.storeGet('app.autoUpdate') ?? false,
);

autoUpdateInternalAtom.onMount = (setAtom) => {
  return electron.storeSubscribe('app.autoUpdate', (v) => setAtom(v));
};

const autoUpdatesAtom = atom(
  (get) => get(autoUpdateInternalAtom),
  (_get, set, newAutoUpdates: boolean) => {
    set(autoUpdateInternalAtom, newAutoUpdates);
    electron.storeSet('app.autoUpdate', newAutoUpdates);
  },
);

const autoUpdateInternalStateAtom = atom(
  (electron.storeGet('autoUpdater') ?? {
    checkingForUpdates: false,
    downloadProgress: 0,
    readyToInstall: false,
    hasUpdate: false,
    nextVersion: null,
    lastCheckedAt: null,
    error: null,
  }) as AutoUpdateState,
);

autoUpdateInternalStateAtom.onMount = (setAtom) => {
  return electron.storeSubscribe('autoUpdater', (v) => {
    setAtom(v as AutoUpdateState);
  });
};

export const useAutoUpdateState = () => {
  return useAtomValue(autoUpdateInternalStateAtom);
};

export const useAutoUpdates = () => {
  return useAtom(autoUpdatesAtom);
};

export const useAutoUpdatesValue = () => {
  return useAtomValue(autoUpdatesAtom);
};

export const useAutoUpdateStartDownload = () => {
  return () => {
    electron.invoke(ipcEvents.UPDATE__DOWNLOAD);
  };
};

export const useAutoUpdateInstallAndRestart = () => {
  return () => electron.invoke(ipcEvents.UPDATE__QUIT_AND_INSTALL);
};

export const useRequestAutoUpdate = () => {
  return () => electron.invoke(ipcEvents.UPDATE__CHECK_FOR_UPDATE_REQUESTED);
};
