import * as React from 'react';
import * as LicenseActions from 'redux/modules/license-module';
import * as UserActions from 'redux/modules/user-module';
import Button from 'components/shared/button';
import ErrorBar from 'components/error-bar';
import Floating from 'components/floating';
import Page from 'components/new/page';
import arrayFirstOrSelf from 'lib/array-first-or-self';
import createApiUrl from 'lib/create-api-url';
import titleTemplate from 'lib/title-template';
import Tracking from 'lib/tracking';
import Link from 'next/link';
import { NextRouter, useRouter } from 'next/router';
import GoogleSVG from 'static/images/google.svg';
import { useAppDispatch, useAppSelector } from 'redux/store';
import css from './signup-pro-trial.module.css';
import signupCss from './signup.module.css';
import TextInput from 'components/shared/form/text-input';
import MessageBanner from 'components/shared/message-banner';
import cx from 'classnames';
import ReCAPTCHA from 'react-google-recaptcha';
import { getRecaptchaStatus } from 'models/user-model';
import { isNetworkErrorWithCode } from 'lib/get-network-error-code';
import { SignupCode } from 'types/signup-error-codes';

const SignupForm = ({
  onSubmit,
}: {
  onSubmit: (data: {
    email: string;
    password: string;
    recaptchaToken: string | undefined;
  }) => Promise<void>;
}) => {
  const [email, setEmail] = React.useState('');
  const router = useRouter();
  const [password, setPassword] = React.useState('');
  const [recaptchaToken, setRecaptchaToken] = React.useState<
    string | undefined
  >();
  const [recaptchaRequired, setRecaptchaRequired] = React.useState(false);

  const handleEmailChange = React.useCallback(
    (ev: React.FormEvent<HTMLInputElement>) => {
      setEmail(ev.currentTarget.value);
    },
    [setEmail],
  );
  const handlePasswordChange = React.useCallback(
    (ev: React.FormEvent<HTMLInputElement>) => {
      setPassword(ev.currentTarget.value);
    },
    [setPassword],
  );
  const handleSubmit = React.useCallback(
    async (ev: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
      ev.preventDefault();
      try {
        onSubmit({ email, password, recaptchaToken });
      } catch (err) {
        setPassword('');

        if (
          isNetworkErrorWithCode(err) &&
          err.code === SignupCode.invalidRecaptchaToken
        ) {
          setRecaptchaRequired(true);
        }
      }
    },
    [onSubmit, email, password, recaptchaToken],
  );

  React.useEffect(() => {
    getRecaptchaStatus()
      .then((result) => {
        setRecaptchaRequired(result.data.isRequired);
      })
      .catch(() => {
        setRecaptchaRequired(true);
      });
  }, []);

  return (
    <div className={css.form}>
      <Button
        style="secondary"
        tone="base"
        size="large"
        fullWidth
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault();
          Tracking.trackEvent('Clicked continue with google', {
            flow: 'signup',
          });
          router.push(
            createApiUrl(`/auth/google?flow=signup&next=create-pro-trial`),
          );
        }}
      >
        <div className={signupCss.buttonContent}>
          <div className={signupCss.buttonIcon}>
            <GoogleSVG />
          </div>
          <div>Continue with Google</div>
        </div>
      </Button>
      <div className={signupCss.or}>
        <hr />
        or
        <hr />
      </div>

      <form onSubmit={handleSubmit}>
        <label>
          Email address
          <TextInput
            type="email"
            className="email"
            value={email}
            placeholder="Email"
            required
            minLength={5}
            maxLength={255}
            onChange={handleEmailChange}
          />
        </label>
        <label>
          Password
          <TextInput
            type="password"
            className="password"
            value={password}
            placeholder="Create new password"
            minLength={4}
            maxLength={255}
            required
            onChange={handlePasswordChange}
          />
        </label>
        {recaptchaRequired && (
          <ReCAPTCHA
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string}
            onChange={(token) => setRecaptchaToken(token ?? undefined)}
          />
        )}
        <Button
          style="primary"
          tone="green"
          type="submit"
          fullWidth
          size="large"
        >
          Sign up
        </Button>
        <div className={signupCss.small}>
          By signing up, you agree to our{' '}
          <Link href="/terms">terms of use</Link> and{' '}
          <Link href="/privacy-policy">privacy policy</Link>
        </div>
      </form>
    </div>
  );
};

const SignupAlert = ({
  customCopy,
  router,
}: {
  customCopy: boolean;
  router: NextRouter;
}) => {
  const {
    query: { next, key },
  } = router;
  if (!next && !key) {
    return null;
  }
  if (key) {
    return (
      <MessageBanner type="info" title="Connect your account">
        <div className={signupCss.message}>
          <p>
            Sign up or log in now to connect your Diffchecker Desktop purchase
            to your account.
          </p>
          <p>Thank you for buying Diffchecker Desktop!</p>
        </div>
      </MessageBanner>
    );
  }
  if (next) {
    return (
      <MessageBanner type="info" title="Log in or sign up to continue">
        {customCopy && next === '/buy-desktop' ? (
          <div>
            <p style={{ marginBottom: 0 }}>
              You need to log in or create an account to purchase Diffchecker
              Desktop
            </p>
          </div>
        ) : (
          'You need to login or create an account to proceed to the next page'
        )}
      </MessageBanner>
    );
  }
  return null;
};

const SignupProTrial = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isLoggedIn = !!useAppSelector((state) => state.user.user);
  const errorField = useAppSelector((state) => state.user.signupErrorField);
  const errorCode =
    useAppSelector((state) => state.user.signupErrorCode) ||
    arrayFirstOrSelf(router.query.error);
  const [signingUp, setSigningUp] = React.useState(false);

  const {
    query: { key },
  } = router;
  const handleClickDownloadDesktop = React.useCallback(() => {
    Tracking.trackEvent('Clicked get diffchecker', {
      type: 'trial',
      position: 'signup-pro-trial',
    });
  }, []);
  const handleSubmit = React.useCallback(
    async ({
      email,
      password,
      recaptchaToken,
    }: {
      email: string;
      password: string;
      recaptchaToken: string | undefined;
    }) => {
      setSigningUp(true);

      dispatch(
        UserActions.signup({
          email,
          password,
          recaptchaToken,
        }),
      )
        .unwrap()
        .then((response) => {
          if (key) {
            dispatch(
              LicenseActions.assignLicense(arrayFirstOrSelf(key)),
            ).unwrap();
          }
          Tracking.setUserId(response.user.id);
          Tracking.trackEvent('Signed up', {
            id: response.user.id,
            kind: 'creds',
          });
          router.push('/create-pro-trial');
        })
        .catch((error) => {
          Tracking.trackEvent('Failed signing up', { error, kind: 'creds' });
          return Promise.reject(error);
        })
        .finally(() => {
          setSigningUp(false);
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return (
    <Page name="Signup" title={titleTemplate('Sign up')}>
      <div className={css.signup}>
        <div className={css.main}>
          <div>
            {isLoggedIn && !signingUp ? (
              <Floating>
                <h2 className={css.heading}>
                  Use Diffchecker Pro
                  <br /> in the browser
                </h2>
                <Button
                  type="brand"
                  style="primary"
                  tone="green"
                  size="large"
                  href="/create-pro-trial"
                  fullWidth
                >
                  Continue to Diffchecker Pro
                </Button>
              </Floating>
            ) : (
              <>
                <Floating>
                  <h2 className={css.heading}>
                    Use Diffchecker Pro
                    <br /> in the browser
                  </h2>

                  <SignupAlert router={router} customCopy={true} />
                  <ErrorBar code={errorCode} field={errorField} />
                  <SignupForm onSubmit={handleSubmit} />
                </Floating>
                <div className={cx(signupCss.small, signupCss.loginLink)}>
                  Already have an account?{' '}
                  <Link href="/login?next=create-pro-trial">Sign in</Link>
                </div>
              </>
            )}
          </div>
          <div>
            <Floating>
              <h2 className={css.heading}>
                Use Diffchecker Pro
                <br /> on your Desktop
              </h2>
              <Button
                type="brand"
                style="primary"
                tone="green"
                size="large"
                onClick={handleClickDownloadDesktop}
                fullWidth
                href="/download-trial"
              >
                Download Diffchecker Desktop
              </Button>
            </Floating>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default SignupProTrial;
