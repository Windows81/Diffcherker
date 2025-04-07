import { getLicenseLoginUrl } from '../desktop-protocol';

import { LicenseState } from 'redux/modules/license-module';

export const openDesktopApp = (license: LicenseState): void => {
  const licenseLoginUrl = getLicenseLoginUrl(license);
  console.log(`License login URL is ${licenseLoginUrl}`); // debugging a bug in production (sometimes, clicking the button does nothing, and the URL is not logged in the console)
  window.location.href = licenseLoginUrl;
};
