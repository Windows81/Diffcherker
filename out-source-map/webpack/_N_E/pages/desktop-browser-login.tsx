import * as LicenseModel from 'models/license-model';
import Button from 'components/shared/button';
import ErrorBar from 'components/error-bar';
import Page from 'components/page';
import withSession from 'components/with-session';
import formatNetworkError from 'lib/format-network-error';
import getOs from 'lib/get-os';
import titleTemplate from 'lib/title-template';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { type LicenseState, getMyLicense } from 'redux/modules/license-module';
import { createTrial } from 'redux/modules/payments-module';
import { State, useAppDispatch } from 'redux/store';
import { type NetworkError } from 'types/network-error';
import { openDesktopApp } from 'lib/open-desktop-app';
import ExpiredLicense from 'components/expired-license';
import Tracking from 'lib/tracking';

const DesktopBrowserLogin = () => {
  const dispatch = useAppDispatch();
  const [license, setLicense] = useState<undefined | LicenseState>();
  const [showLicenseKey, setShowLicenseKey] = useState(false);
  const email = useSelector((state: State) => state.user.user?.email);
  const router = useRouter();
  const [errorCode, setErrorCode] = useState<undefined | string>();
  const [errorMessage, setErrorMessage] = useState<undefined | string>();
  const [errorDetails, setErrorDetails] = useState<undefined | string>();

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
    const getLicenseFromApi = async () => {
      const response = await dispatch(
        getMyLicense({ desktopOnly: true }),
      ).unwrap();
      return response.license;
    };
    const getLicense = async () => {
      try {
        const license = await getLicenseFromApi();
        return license;
      } catch (error) {
        if ((error as NetworkError).code !== 'LICENSE_NOT_FOUND') {
          throw error;
        }
        await dispatch(createTrial());
        Tracking.trackEvent('Started trial', {
          source: 'desktop',
        });
        const license = await getLicenseFromApi();

        return license;
      }
    };
    getLicense().then(async (license) => {
      const {
        query: { fingerprint, machineName },
      } = router;
      if (typeof fingerprint !== 'string' || typeof machineName !== 'string') {
        setLicense(license);
        return;
      }
      try {
        const response = await LicenseModel.validateKey(
          license.key,
          fingerprint,
          machineName,
        );
        if (!response.data.valid) {
          handleKeyValidationError({
            code: response.data.code,
          });
          return;
        }
        setLicense(response.data.license);
      } catch (error) {
        handleKeyValidationError(formatNetworkError(error));
      }
    });
    const os = getOs();
    if (os === 'linux') {
      setShowLicenseKey(true);
    }
  }, [dispatch, router]);

  const displayError = errorCode || errorMessage || errorDetails;

  return (
    <Page name="Log in to Diffchecker Desktop">
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
              You are now logged in as
              <br />
              {email}
            </div>
            <div style={{ width: 300, textAlign: 'center', margin: '0 auto' }}>
              <Button
                style="primary"
                tone="green"
                size="xl"
                fullWidth
                isLoading={!license}
                onClick={async () => await getLicenseDataAndOpenDesktopApp()}
              >
                Open the Desktop App
              </Button>
            </div>
          </>
        )}
        {displayError && (
          <ErrorBar
            code={errorCode}
            message={errorMessage}
            details={errorDetails}
          />
        )}
      </div>
    </Page>
  );
};

export default withSession(DesktopBrowserLogin);
