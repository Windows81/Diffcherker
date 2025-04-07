import React from 'react';
import AccessLicenseExpiredModal from './access-license-expired-modal';
import UpdatesLicenseExpiredModal from './updates-license-expired-modal';
import { useLicenseValue } from 'lib/state/license';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface LicenseExpiredModalProps {}

const LicenseExpiredModal: React.FC<LicenseExpiredModalProps> = () => {
  const license = useLicenseValue();
  return license.isTrial || !license.valid || license.allows === 'access' ? (
    <AccessLicenseExpiredModal license={license} />
  ) : (
    <UpdatesLicenseExpiredModal />
  );
};

export default LicenseExpiredModal;
