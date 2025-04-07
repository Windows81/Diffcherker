import * as LicenseModel from 'models/license-model';
import Button from 'components/button';
import ErrorBar from 'components/error-bar';
import Page from 'components/page';
import formatNetworkError from 'lib/format-network-error';
import getOs from 'lib/get-os';
import titleTemplate from 'lib/title-template';
import Tracking from 'lib/tracking';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { type LicenseState } from 'redux/modules/license-module';
import { useAppDispatch } from 'redux/store';
import { type NetworkError } from 'types/network-error';

import css from './desktop-browser-login-license-key.module.css';
import { openDesktopApp } from 'lib/open-desktop-app';
import ExpiredLicense from 'components/expired-license';

const DesktopBrowserLoginLicenseKey = () => {
  const dispatch = useAppDispatch();
  const [license, setLicense] = useState<undefined | LicenseState>();
  const [showLicenseKey, setShowLicenseKey] = useState(false);
  const router = useRouter();
  const [errorCode, setErrorCode] = useState<undefined | string>();
  const [errorMessage, setErrorMessage] = useState<undefined | string>();
  const [errorDetails, setErrorDetails] = useState<undefined | string>();
  const [loggedIn, setLoggedIn] = useState(false);

  const params = router.query;
  const [licenseKey, setLicenseKey] = useState<string>(
    router.query.key as string,
  );
  const fingerprint: string = params.fingerprint as string;
  const machineName: string = params.machineName as string;
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmitLicenseKey = async () => {
    try {
      const response = await LicenseModel.validateKey(
        licenseKey,
        fingerprint,
        machineName,
      );
      if (!response.data.valid) {
        // Special handling for expired licenses which return 200s
        // Non-trial licenses are still 'valid' after expiration
        // Trial licenses are invalid and will fall into this block
        handleKeyValidationError({
          code: response.data.code,
        });
        return;
      }
      Tracking.trackEvent('Submitted login form with license key');
      setLicense(response.data.license);
      setLoggedIn(true);
    } catch (error) {
      handleKeyValidationError(formatNetworkError(error));
    }
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formRef.current) {
      handleSubmitLicenseKey();
    }
  };

  const handleLicenseKeyChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setLicenseKey(event.target.value);
  };

  const renderLicenseKeyLogin = () => {
    return (
      <>
        <div className={css.wideFloating}>
          <div className={css.login}>
            <h2>Sign in to Diffchecker</h2>
            {displayError && (
              <ErrorBar
                code={errorCode}
                message={errorMessage}
                details={errorDetails}
              />
            )}
            <form onSubmit={submitForm} ref={formRef}>
              <label>
                License Key
                <input
                  type="text"
                  className="license"
                  value={licenseKey!}
                  placeholder={'License Key'}
                  onChange={handleLicenseKeyChange}
                />
              </label>
              <Button
                buttonType="submit"
                type="brand"
                fullWidth
                style={{ marginTop: 10, marginBottom: 10 }}
              >
                Sign in
              </Button>
            </form>
          </div>
        </div>
      </>
    );
  };

  const handleKeyValidationError = (error: Pick<NetworkError, 'code'>) => {
    setErrorCode(error.code);
    if (!error.code) {
      setErrorMessage('License key error. Click "Show details" to see more.');
    }
    setErrorDetails(JSON.stringify(error));
  };

  const getLicenseDataAndOpenDesktopApp = async () => {
    try {
      if (license?.key) {
        openDesktopApp(license);
      }
    } catch (error) {
      setErrorCode((error as NetworkError).code);
      setErrorMessage((error as NetworkError).message);
    }
  };
  useEffect(() => {
    const os = getOs();
    if (os === 'linux') {
      setShowLicenseKey(true);
    }
  }, [dispatch, router]);

  useEffect(() => {
    // automatically submit the form on first render once license key is populated
    if (licenseKey) {
      handleSubmitLicenseKey();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayError = errorCode || errorMessage || errorDetails;

  return (
    <Page name="Log in to Diffchecker Desktop with License">
      {!loggedIn ? (
        renderLicenseKeyLogin()
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              paddingTop: 60,
              display: 'flex',
            }}
          ></div>
          <Head>
            <title>{titleTemplate('Log in to Diffchecker Desktop')}</title>
          </Head>
          <img
            src="/static/images/new/diffchecker.svg"
            alt="Diffchecker logo"
            style={{
              height: 60,
              width: 60,
            }}
          />
          {license?.isExpired &&
          (license.isTrial || license.allows === 'access') ? (
            <ExpiredLicense isTrial={license.isTrial!} />
          ) : showLicenseKey ? (
            <h2>
              Your license key is: {license?.key}
              <br />
              <br />
              Log in at the bottom of your Diffchecker Desktop window.
            </h2>
          ) : (
            <>
              <div style={{ fontSize: 26, marginBottom: 32, marginTop: 16 }}>
                You are now logged in with the license key:
                <br />
                {licenseKey}
              </div>
              <div
                style={{ width: 300, textAlign: 'center', margin: '0 auto' }}
              >
                <Button
                  type="brand"
                  size="big"
                  fullWidth
                  onClick={async () => await getLicenseDataAndOpenDesktopApp()}
                >
                  Open the Desktop App
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Page>
  );
};

export default DesktopBrowserLoginLicenseKey;
