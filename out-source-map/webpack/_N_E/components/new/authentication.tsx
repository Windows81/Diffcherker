import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  useIsLicenseValid,
  useLicenseValue,
  useLogoutDesktop,
} from 'lib/state/license';
import yn from 'yn';
import arrayFirstOrSelf from 'lib/array-first-or-self';
import Loading from 'components/loading';
import { useAppDispatch } from 'redux/store';
import * as LicenseActions from 'redux/modules/license-module';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AuthenticationProps {}

const Authentication: React.FC<
  React.PropsWithChildren<AuthenticationProps>
> = ({ children }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const license = useLicenseValue();
  const isLicenseValid = useIsLicenseValid();
  const [licenseLoaded, setLicenseLoaded] = useState(false);
  const logoutDesktop = useLogoutDesktop();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_IS_ELECTRON) {
      return;
    }

    if (yn(process.env.PERPETUAL_BUILD)) {
      dispatch(LicenseActions.actions.makeLicensePerpetual());
      setLicenseLoaded(true);
      return;
    }
    if (yn(process.env.OFFLINE_BUILD)) {
      const validatedOffline =
        arrayFirstOrSelf(router.query?.validatedOffline) || !!license?.key;

      if (!validatedOffline) {
        logoutDesktop();
        return;
      }
      setLicenseLoaded(true);
    } else {
      const key = arrayFirstOrSelf(router.query?.key) || license?.key;
      if (!key) {
        logoutDesktop();
        return;
      }
      dispatch(LicenseActions.validateKeyOnStart(key)).then(() =>
        setLicenseLoaded(true),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_IS_ELECTRON || !licenseLoaded) {
      return;
    }
    if (license.error || license.isRevoked) {
      logoutDesktop();
      return;
    }
  }, [licenseLoaded]);

  return (
    <div>
      {isLicenseValid ? (
        <>{children}</>
      ) : (
        <div className="loader-layout">
          <div className="loader">
            <Loading message="Diffchecker loading..." />
          </div>
        </div>
      )}
      <style jsx global>{`
        .loader-layout {
          width: 100%;
          height: 100vh;
          display: flex;
        }
        .loader {
          margin: auto;
        }
      `}</style>
    </div>
  );
};

export default Authentication;
