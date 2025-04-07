// import { useRouter } from 'next/router';
import Tracking from 'lib/tracking';
import Page from 'components/new/page';
import css from './[key].module.css';
import withSession from 'components/with-session';
import Button from 'components/shared/button';
import { useAppDispatch, useAppSelector } from 'redux/store';
import { useCallback, useEffect, useState } from 'react';
import * as LicenseActions from 'redux/modules/license-module';
import { useRouter } from 'next/router';
import Logo from 'components/new/logo';
import { normalizeError } from 'lib/messages';
import MessageBanner from 'components/shared/message-banner';
import { captureException } from 'lib/sentry';
import Skeleton from 'components/shared/loaders/skeleton';
import Skeletons from 'components/shared/loaders/skeletons';

const LicenseAssign: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const licenseDetails = useAppSelector((state) => state.license);
  const key = router.query.key as string;
  const [keyValidationError, setKeyValidationError] = useState<
    Error | undefined
  >();
  const [acceptLicenseError, setAcceptLicenseError] = useState<
    Error | undefined
  >();
  const user = useAppSelector((state) => state.user.user);
  const [isValidateKeyLoading, setIsValidateKeyLoading] =
    useState<boolean>(true);
  const [isAcceptKeyLoading, setIsAcceptKeyLoading] = useState<boolean>(false);

  useEffect(() => {
    const validateKey = async () => {
      if (key) {
        try {
          setIsValidateKeyLoading(true);
          await dispatch(
            LicenseActions.validateKey({
              key,
              fingerprint: 'browser',
              validateUnassigned: true,
            }),
          ).unwrap();
        } catch (e) {
          captureException(
            `Key was invalid on /license/assign route: ${key} for user ${
              user?.email ?? 'unknown'
            }. Error: ${normalizeError(e).message}`,
          );
          setKeyValidationError(normalizeError(e));
        } finally {
          setIsValidateKeyLoading(false);
        }
      }
    };

    validateKey();
  }, [dispatch, key, user?.email]);

  const assignLicense = useCallback(
    async (key: string) => {
      try {
        setIsAcceptKeyLoading(true);
        await dispatch(LicenseActions.assignLicense(key)).unwrap();
        Tracking.trackEvent('Assigned license key', { flow: 'signup' });
        router.push('/account');
      } catch (e) {
        captureException(
          `Failed to assign key ${key} to user ${
            user?.email ?? 'unknown'
          }. Error: ${normalizeError(e).message}`,
        );
        setAcceptLicenseError(normalizeError(e));
      } finally {
        setIsAcceptKeyLoading(false);
      }
    },
    [dispatch, router, user?.email],
  );

  return (
    <Page
      name="Licence Assign"
      hasHeader={false}
      fullWidth
      title="You are being assigned a Diffchecker License!"
    >
      <header className={css.navbar}>
        <Logo />
      </header>

      <main className={css.main}>
        <h1 className={css.acceptHeader}>Accept your License</h1>
        {isValidateKeyLoading ? (
          <Skeletons>
            <Skeleton height="88px" className={css.lastSkeleton} />
          </Skeletons>
        ) : keyValidationError ? (
          <div className={css.messageBoxContainer}>
            <MessageBanner title={keyValidationError.message} type="error" />
          </div>
        ) : (
          <>
            <p>
              {`You've been offered a Diffchecker license`} from{' '}
              <strong>{licenseDetails.ownerEmail}</strong>
            </p>
            <div className={css.buttonContainer}>
              <Button
                size="large"
                style="primary"
                tone="green"
                isLoading={isAcceptKeyLoading}
                onClick={() => {
                  assignLicense(key);
                }}
              >
                Accept License
              </Button>
            </div>
            {acceptLicenseError && (
              <div className={css.messageBoxContainer}>
                <MessageBanner
                  title={acceptLicenseError.message}
                  type="error"
                />
              </div>
            )}
          </>
        )}
        {}
      </main>
    </Page>
  );
};

export default withSession(LicenseAssign, '/signup');
