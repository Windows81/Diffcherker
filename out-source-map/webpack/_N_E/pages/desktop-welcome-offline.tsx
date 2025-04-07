import Button from 'components/button';
import Page from 'components/page';
import { colors, text } from 'css/variables';
import getNetworkErrorCode from 'lib/get-network-error-code';
import ErrorPage from 'next/error';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { actions } from 'redux/modules/license-module';
import { useAppDispatch } from 'redux/store';
import { jwtDecode } from 'jwt-decode';
import { verifySignature } from 'lib/jwt-encode';
import { useLicenseValidationCode } from 'lib/state/license';
import dynamic from 'next/dynamic';

const ErrorBar = dynamic(
  async () => {
    return await import('components/error-bar');
  },
  { ssr: false },
);

const DesktopWelcome = () => {
  const [fingerprint, setFingerprint] = useState<string>('');
  const [errorCode, setErrorCode] = useState<undefined | string>();
  const [errorMessage, setErrorMessage] = useState<undefined | string>();
  const [errorDetails, setErrorDetails] = useState<undefined | string>();
  const [key, setKey] = useState<undefined | string>();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const licenseValidationCode = useLicenseValidationCode();

  const handleKeyValidationError = useCallback(
    (error: unknown) => {
      const code = getNetworkErrorCode(error, { allowUndefined: true });
      setErrorCode(code);
      if (!code) {
        setErrorMessage('License key error. Click "Show details" to see more.');
      }
      setErrorDetails(JSON.stringify(error));
      dispatch(actions.clearLicense());
    },
    [dispatch],
  );

  const startKeyValidation = async (key: string) => {
    setErrorCode(undefined);
    setErrorMessage(undefined);
    setErrorDetails(undefined);

    try {
      if (!verifySignature(key)) {
        handleKeyValidationError({ code: 'LICENSE_KEY_NOT_VALID' });
        return;
      }

      const licenseDetails =
        jwtDecode<Record<string, string | number | symbol | boolean>>(key);

      //TODO: Add JWT signature validation
      if (licenseDetails.machineId !== fingerprint) {
        handleKeyValidationError({ code: 'LICENSE_OFFLINE_MACHINE_INVALID' });
        return;
      }

      dispatch(
        actions.setLicenseFromBrowser({
          key,
          ...licenseDetails,
        }),
      );
      router.push(`/start-desktop-tab?validatedOffline=true`);
    } catch (e) {
      handleKeyValidationError({ code: 'LICENSE_OFFLINE_FORMAT_INCORRECT' });
    }
  };

  useEffect(() => {
    const getAndSetFingerprint = async () => {
      const fingerprint = await window.fingerprint();
      setFingerprint(fingerprint);
    };

    getAndSetFingerprint();
  }, []);

  const displayError = errorCode || licenseValidationCode || errorDetails;
  return (
    <Page name="Welcome Desktop">
      <Head>
        <title>Diffchecker</title>
      </Head>
      <div style={{ height: 'calc(100vh - 38px)', textAlign: 'center' }}>
        <div
          style={{
            paddingTop: 60,
            display: 'flex',
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <img
              src="/static/images/new/diffchecker.svg"
              alt="Diffchecker logo"
              style={{
                display: 'block',
                verticalAlign: 'middle',
                width: 54,
                margin: '0 auto',
              }}
            />
            <div style={{ fontSize: 26, marginBottom: 32, marginTop: 24 }}>
              Welcome to Diffchecker Desktop
            </div>

            <form>
              <label>
                Machine ID
                <input
                  type="text"
                  readOnly
                  value={fingerprint}
                  style={{ minWidth: 460, textAlign: 'center' }}
                />
              </label>

              <br />
              <label>
                Machine Specific License key
                <textarea
                  rows={4}
                  style={{ maxWidth: 460, maxHeight: 200, margin: '16px auto' }}
                  placeholder=""
                  onChange={(event) => setKey(event.target.value)}
                />
              </label>
              <Button
                disabled={!key}
                onClick={async (event) => {
                  event.preventDefault();
                  if (!key) {
                    return;
                  }
                  startKeyValidation(key);
                }}
              >
                Log in with license key
              </Button>
            </form>

            {displayError && (
              <ErrorBar
                code={errorCode || licenseValidationCode}
                message={errorMessage}
                details={errorDetails}
              />
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        input {
          width: 270px !important;
          margin: 3px auto 15px;
        }
        label {
          font-size: ${text.label.small.size};
          font-weight: ${text.label.weight};
        }
        .small {
          font-size: ${text.label.default.size};
          color: var(--front-strong);
          margin-bottom: 0;
        }
        .small a {
          color: ${colors.brand.default};
        }
      `}</style>
    </Page>
  );
};

export default !process.env.NEXT_PUBLIC_IS_ELECTRON
  ? () => <ErrorPage title="Page does not exist." statusCode={404} />
  : DesktopWelcome;
