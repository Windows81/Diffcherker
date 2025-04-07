import * as electron from './electron';
import * as LicenseActions from 'redux/modules/license-module';
import * as UserActions from 'redux/modules/user-module';
import ipcEvents from 'ipc-events';
import { useAppDispatch } from 'redux/store';
import { differenceInCalendarDays } from 'date-fns';
import { atom, useAtom, useAtomValue } from 'jotai';
import yn from 'yn';

const disableLicenseModalInternalAtom = atom(
  electron.storeGet('app.disableLicenseModal') ?? false,
);

disableLicenseModalInternalAtom.onMount = (setAtom) => {
  return electron.storeSubscribe('app.disableLicenseModal', (v) => setAtom(v));
};

const disableLicenseModalAtom = atom(
  (get) => get(disableLicenseModalInternalAtom),
  (_get, set, disableModal: boolean) => {
    set(disableLicenseModalInternalAtom, disableModal);
    electron.storeSet('app.disableLicenseModal', disableModal);
  },
);

export const useDisableLicenseModal = () => {
  return useAtom(disableLicenseModalAtom);
};

export const useDisableLicenseModalValue = () => {
  return useAtomValue(disableLicenseModalAtom);
};

// We're using jotai as a wrapper to subscribe to license state changes made in the electron store.
// This setup allows us to use Jotai hooks in different components to access the license state, which
// will trigger a re-render in any component using this atom.
const licenseInternalAtom = atom(electron.storeGet('license') ?? {});

licenseInternalAtom.onMount = (setAtom) => {
  return electron.storeSubscribe('license', (v) => {
    setAtom(v);
  });
};

const licenseAtom = atom((get) => get(licenseInternalAtom));

export const useLogoutDesktop = () => {
  const dispatch = useAppDispatch();
  const isOffline = yn(process.env.OFFLINE_BUILD);
  const logoutDesktop = () => {
    dispatch(UserActions.actions.logoutDesktop());
    dispatch(LicenseActions.actions.clearLicense());
    electron.send(ipcEvents.APP__LOGOUT_REQUESTED, { isOffline });
  };
  return logoutDesktop;
};

export const useLicenseValidationCode = () => {
  const license = useAtomValue(licenseAtom);
  return license?.validationCode;
};

export const useLicensePlanTier = () => {
  const license = useAtomValue(licenseAtom);
  return license?.planTier;
};

export const useLicenseValue = () => {
  return useAtomValue(licenseAtom);
};

export const useIsLicenseExpired = () => {
  const license = useAtomValue(licenseAtom);
  return (
    license &&
    license.key &&
    (license.isExpired ||
      differenceInCalendarDays(new Date(license.expiresAt || 0), new Date()) <
        -2)
  ); // we're adding -2 to take into account timezones (maybe) and expires is a day early (for some reason) https://github.com/checkersoftware/diffchecker-api/pull/38/files
};

export const useIsLicenseValid = () => {
  const license = useAtomValue(licenseAtom);
  if (!license) {
    return false;
  }
  if (!license.key) {
    return false;
  }
  if (license.isRevoked) {
    return false;
  }
  if (license.error) {
    return false;
  }
  return true;
};
