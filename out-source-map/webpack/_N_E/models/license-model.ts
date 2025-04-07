import type Sentry from '@sentry/types';
import axios, { type AxiosResponse } from 'axios';
import createApiUrl from 'lib/create-api-url';
import getMachineName from 'lib/get-machine-name';
import { type State } from 'redux/store';

declare global {
  interface Window {
    fingerprint: Function;
    machine: { username: string; platform: string; architecture: string };
    store: {
      get: Function;
      set: Function;
      delete: Function;
      store: State;
      onDidChange: Function;
    };
    webContentsId: number;
    ipcRenderer: {
      send: Function;
      on: Function;
      invoke: Function;
      removeListener: Function;
    };
    appVersion: string;
    electronIsDev: boolean;
    formattedAppPath: Function;
    GA_INITIALIZED: boolean;
    setUpdateModalState: Function;
    _carbonads: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    detectCheckerForFile: Function;
    adsbygoogle: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    Sentry: typeof Sentry;

    // BuySellAds: https://docs.buysellads.com/optimize/functions
    optimize: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

export const validateKey = async (
  licenseKey: string,
  fingerprint?: string,
  machineName?: string,
): Promise<AxiosResponse> => {
  const data: { licenseKey: string; fingerprint?: string; name?: string } = {
    licenseKey,
  };
  data.fingerprint = fingerprint || (await window.fingerprint());
  data.name = machineName || getMachineName();

  return await axios.post(createApiUrl(`/licenses/actions/validate-key`), data);
};

export const getLicenses = async (): Promise<AxiosResponse> => {
  return await axios.get(createApiUrl(`/licenses`));
};

export const getMyLicense = async (
  desktopOnly?: boolean,
): Promise<AxiosResponse> => {
  return await axios.get(
    createApiUrl(`/licenses/mine${desktopOnly ? `?desktopOnly=true` : ''}`),
  );
};

export const unassignLicense = async (
  licenseId: number,
): Promise<AxiosResponse<{ key: string }>> => {
  return await axios.post(
    createApiUrl(`/licenses/${licenseId}/actions/unassign`),
  );
};
