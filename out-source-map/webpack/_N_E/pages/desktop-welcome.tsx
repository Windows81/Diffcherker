import Button from 'components/shared/button';
import Page from 'components/page';
import { differenceInDays } from 'date-fns';
import createWebUrl from 'lib/create-web-url';
import getMachineName from 'lib/get-machine-name';
import getNetworkErrorCode from 'lib/get-network-error-code';
import Tracking from 'lib/tracking';
import ErrorPage from 'next/error';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useState } from 'react';
import { actions, validateKey } from 'redux/modules/license-module';
import { useAppDispatch } from 'redux/store';
import RefreshSvg from 'components/shared/icons/refresh.svg';
import ArrowRightSvg from 'components/shared/icons/arrow-right.svg';
import ArrowLeftSvg from 'components/shared/icons/arrow-left.svg';
import ipcEvents from '../ipc-events';
import { TRIAL_LENGTH_IN_DAYS } from 'types/constants';
import { useLicenseValidationCode } from 'lib/state/license';
import dynamic from 'next/dynamic';
import Divider from 'components/shared/divider';
import css from './desktop-welcome.module.css';
import cx from 'classnames';
import IconButton from 'components/shared/icon-button';

const ErrorBar = dynamic(
  async () => {
    return await import('components/error-bar');
  },
  { ssr: false },
);

const openPage = async (href: string) => {
  window.ipcRenderer.send(
    ipcEvents.APP__OPEN_EXTERNAL_REQUESTED,
    createWebUrl(href),
  );
};

const openBrowserLoginPage = async (authFlow: 'signup' | 'login') => {
  const fingerprint = await window.fingerprint();
  const machineName = getMachineName();
  let query = `?fingerprint=${encodeURIComponent(
    fingerprint,
  )}&machineName=${encodeURIComponent(machineName)}`;
  if (authFlow === 'signup') {
    query += '&signup=true';
  }
  openPage(`/desktop-browser-login/${query}`);
};

const openBrowserLoginWithLicenseKey = async (key: string) => {
  const fingerprint = await window.fingerprint();
  const machineName = getMachineName();
  let query = `?machineName=${encodeURIComponent(
    machineName,
  )}&fingerprint=${encodeURIComponent(fingerprint)}`;
  query += `&key=${key}`;
  openPage(`/desktop-browser-login-license-key/${query}`);
};

interface DesktopOnboardingProps {
  setLoggingIn: (value: boolean) => void;
  setShowLicenseKey: (value: boolean) => void;
}

const DesktopOnboarding = ({
  setLoggingIn,
  setShowLicenseKey,
}: DesktopOnboardingProps) => {
  return (
    <div className={cx(css.largePadding)}>
      <div className={cx(css.padding)}>
        <div className={cx(css.logo)}>
          <img
            src="/static/images/new/diffchecker.svg"
            alt="Diffchecker logo"
            className={cx(css.logoImage)}
          />
          <span className={cx(css.logoText)}>
            <span>Diff</span>
            checker
          </span>
        </div>
        <div className={cx(css.description, css.lineHeight, css.small)}>
          Diffchecker gives you the best tools to compare all types of files,
          including text, PDFs, Word documents, images, file and folders
        </div>
      </div>
      <div className={cx(css.padding)}>
        <div className={cx(css.buttonContainer)}>
          <Button
            style="primary"
            tone="green"
            className={cx(css.button)}
            fullWidth
            onClick={() => {
              Tracking.trackEvent('Clicked signup on desktop');
              setLoggingIn(true);
              openBrowserLoginPage('signup');
            }}
          >
            Start free {TRIAL_LENGTH_IN_DAYS}-day trial
          </Button>
          <Button
            style="secondary"
            tone="base"
            className={cx(css.button)}
            fullWidth
            onClick={(ev: React.MouseEvent<HTMLButtonElement>) => {
              ev.preventDefault();
              Tracking.trackEvent('Clicked login on desktop');
              setLoggingIn(true);
              openBrowserLoginPage('login');
            }}
          >
            Sign in
          </Button>
        </div>
        <div className={cx(css.small)}>
          Have a license?{' '}
          <a
            href=""
            onClick={(ev) => {
              ev.preventDefault();
              setShowLicenseKey(true);
            }}
          >
            Enter your license key
          </a>
        </div>
      </div>
    </div>
  );
};

interface DesktopSignInProps {
  errorCode?: string;
  errorMessage?: string;
  errorDetails?: string;
  licenseValidationCode?: string;
  displayError: boolean;
  clearErrors: () => void;
  setLoggingIn: (value: boolean) => void;
  startKeyValidation: (key: string) => void;
}

const DesktopSignIn = ({
  errorCode,
  errorMessage,
  errorDetails,
  licenseValidationCode,
  displayError,
  clearErrors,
  setLoggingIn,
  startKeyValidation,
}: DesktopSignInProps): JSX.Element => {
  const [key, setKey] = useState<string | undefined>();
  return (
    <div className={cx(css.padding)}>
      <div className={cx(css.innerPadding)}>
        <Button
          style="text"
          onClick={(ev: React.MouseEvent) => {
            ev.preventDefault();
            clearErrors();
            setLoggingIn(false);
          }}
          iconStartSvg={ArrowLeftSvg}
          className={cx(css.backButton)}
        >
          Back
        </Button>
        <div className={cx(css.title)}>Sign in to Diffchecker</div>
      </div>
      <div className={cx(css.innerPadding)}>
        <div className={cx(css.small, css.lineHeight)}>
          Go to the browser to complete login.
          <br />
          Not seeing the browser tab?{' '}
        </div>
        <Button
          style="secondary"
          tone="base"
          className={cx(css.button)}
          onClick={(ev: React.MouseEvent) => {
            ev.preventDefault();
            Tracking.trackEvent('Clicked login on desktop');
            openBrowserLoginPage('login');
          }}
          iconStartSvg={RefreshSvg}
        >
          Try again
        </Button>
      </div>
      <div className={cx(css.divider)}>
        <Divider label="OR" className={cx(css.dividerText)} />
      </div>
      <form className={cx(css.form)}>
        <div className={cx(css.license)}>
          <label>
            Your license key
            <div style={{ marginTop: 'var(--dimensions-spacing-small)' }}>
              <input
                type="text"
                placeholder=""
                onChange={(event) => setKey(event.target.value)}
                value={key}
              />
            </div>
          </label>
          <IconButton
            style="secondary"
            tone="base"
            className={cx(css.iconButton)}
            onClick={async (event: React.MouseEvent) => {
              event.preventDefault();
              if (!key) {
                return;
              }
              startKeyValidation(key);
            }}
            svg={ArrowRightSvg}
          />
        </div>
        {displayError && (
          <ErrorBar
            code={errorCode || licenseValidationCode}
            message={errorMessage}
            details={errorDetails}
          />
        )}
      </form>
      <div className={cx(css.small)}>
        Trouble signing in?{' '}
        <a
          href=""
          onClick={(ev) => {
            ev.preventDefault();
            openPage('/contact/');
          }}
        >
          Contact support
        </a>
      </div>
    </div>
  );
};

interface DesktopLicenseKeyProps {
  errorCode?: string;
  errorMessage?: string;
  errorDetails?: string;
  licenseValidationCode?: string;
  displayError: boolean;
  clearErrors: () => void;
  startKeyValidation: (key: string) => void;
  setShowLicenseKey: (key: boolean) => void;
}

const DesktopLicenseKey = ({
  errorCode,
  errorMessage,
  errorDetails,
  licenseValidationCode,
  displayError,
  clearErrors,
  startKeyValidation,
  setShowLicenseKey,
}: DesktopLicenseKeyProps) => {
  const [key, setKey] = useState<string | undefined>();
  return (
    <div className={cx(css.padding)}>
      <div className={cx(css.innerPadding)}>
        <Button
          style="text"
          onClick={(ev: React.MouseEvent) => {
            ev.preventDefault();
            clearErrors();
            setShowLicenseKey(false);
          }}
          iconStartSvg={ArrowLeftSvg}
          className={cx(css.backButton)}
        >
          Back
        </Button>
        <div className={cx(css.title)}>Your Diffchecker license key</div>
      </div>
      <form className={cx(css.form)}>
        <div className={cx(css.license)}>
          <input
            type="text"
            placeholder="0000-0000-0000-0000"
            onChange={(event) => setKey(event.target.value)}
            value={key}
          />
          <IconButton
            style="secondary"
            tone="base"
            className={cx(css.iconButton)}
            onClick={async (event: React.MouseEvent) => {
              event.preventDefault();
              if (!key) {
                return;
              }
              startKeyValidation(key);
            }}
            svg={ArrowRightSvg}
          />
        </div>
      </form>
      {displayError && (
        <ErrorBar
          code={errorCode || licenseValidationCode}
          message={errorMessage}
          details={errorDetails}
        />
      )}
      <div className={cx(css.small)}>
        Trouble signing in?{' '}
        <a
          href=""
          onClick={(ev) => {
            ev.preventDefault();
            openPage('/contact/');
          }}
        >
          Contact support
        </a>
      </div>
    </div>
  );
};

const DesktopWelcome = () => {
  const [loggingIn, setLoggingIn] = useState(false);
  const [showLicenseKey, setShowLicenseKey] = useState(false);
  const [errorCode, setErrorCode] = useState<undefined | string>();
  const [errorMessage, setErrorMessage] = useState<undefined | string>();
  const [errorDetails, setErrorDetails] = useState<undefined | string>();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const licenseValidationCode = useLicenseValidationCode();

  const clearErrors = () => {
    setErrorCode(undefined);
    setErrorMessage(undefined);
    setErrorDetails(undefined);
  };

  const handleKeyValidationError = useCallback((error: unknown) => {
    const code = getNetworkErrorCode(error, { allowUndefined: true });
    setErrorCode(code);
    if (!code) {
      setErrorMessage('License key error. Click "Show details" to see more.');
    }
    setErrorDetails(JSON.stringify(error));
  }, []);

  const startKeyValidation = async (key: string) => {
    clearErrors();
    try {
      const response = await dispatch(validateKey({ key })).unwrap();
      if (!response.valid) {
        handleKeyValidationError({ code: response.code });
        return;
      }
      router.push(`/start-desktop-tab?key=${key}`);
    } catch (error) {
      const code = getNetworkErrorCode(error, { allowUndefined: true });
      if (
        !code ||
        code === 'FIREWALL_ISSUES' ||
        code === 'DATABASE_CONNECTION_ERROR'
      ) {
        // If application has network problems, the browser may work instead
        openBrowserLoginWithLicenseKey(key);
      }
      handleKeyValidationError(error);
    }
  };

  useEffect(() => {
    window.ipcRenderer.on(
      ipcEvents.APP__LOGIN_WITH_LICENSE_DATA,
      (_event: Event, licenseData: { isTrial: boolean; key: number }) => {
        const firstLoggedIn = window.store.get('global.firstLoggedIn') as
          | number
          | undefined;
        const allowedToUseMoreTrials = firstLoggedIn
          ? differenceInDays(new Date(), firstLoggedIn) <= 60
          : true;
        if (licenseData.isTrial && !allowedToUseMoreTrials) {
          return handleKeyValidationError({
            code: 'TRYING_TO_DOUBLE_UP_ON_TRIALS',
          });
        }
        dispatch(actions.setLicenseFromBrowser(licenseData));
        router.push(`/start-desktop-tab?key=${licenseData.key}`);
      },
    );
  }, [dispatch, router, handleKeyValidationError]);

  const displayError = errorCode || licenseValidationCode || errorDetails;
  useEffect(() => {
    // If user gets signed out while logged in (e.g. license revoked, expired, etc.),
    // render the DesktopLicenseKey compontent rather than DesktopOnboarding to see the error
    if (displayError && !loggingIn && !showLicenseKey) {
      setShowLicenseKey(true);
    }
  }, []);

  return (
    <Page name="Welcome Desktop">
      <Head>
        <title>Diffchecker</title>
      </Head>
      <div
        className={cx(
          css.container,
          !loggingIn && !showLicenseKey && css.shadow,
        )}
      >
        <div className={cx(css.innerContainer)}>
          {!loggingIn && !showLicenseKey && (
            <DesktopOnboarding
              setLoggingIn={setLoggingIn}
              setShowLicenseKey={setShowLicenseKey}
            />
          )}
          {loggingIn && (
            <DesktopSignIn
              errorCode={errorCode}
              errorMessage={errorMessage}
              errorDetails={errorDetails}
              licenseValidationCode={licenseValidationCode}
              displayError={displayError}
              clearErrors={clearErrors}
              setLoggingIn={setLoggingIn}
              startKeyValidation={startKeyValidation}
            />
          )}
          {showLicenseKey && (
            <DesktopLicenseKey
              errorCode={errorCode}
              errorMessage={errorMessage}
              errorDetails={errorDetails}
              displayError={displayError}
              clearErrors={clearErrors}
              licenseValidationCode={licenseValidationCode}
              startKeyValidation={startKeyValidation}
              setShowLicenseKey={setShowLicenseKey}
            />
          )}
        </div>
      </div>
    </Page>
  );
};

export default !process.env.NEXT_PUBLIC_IS_ELECTRON
  ? () => <ErrorPage title="Page does not exist." statusCode={404} />
  : DesktopWelcome;
