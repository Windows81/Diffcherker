import * as LicenseActions from 'redux/modules/license-module';
import * as UserActions from 'redux/modules/user-module';
import cx from 'classnames';
import Button from 'components/shared/button';
import ErrorBar from 'components/error-bar';
import Page from 'components/new/page';
import arrayFirstOrSelf from 'lib/array-first-or-self';
import createApiUrl from 'lib/create-api-url';
import generateUrl from 'lib/generate-url';
import titleTemplate from 'lib/title-template';
import Tracking from 'lib/tracking';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store';
import GoogleSVG from 'static/images/google.svg';
import ReCAPTCHA from 'react-google-recaptcha';

import css from './signup.module.css';
import TextInput from 'components/shared/form/text-input';
import MessageBanner from 'components/shared/message-banner';
import { getRecaptchaStatus } from 'models/user-model';
import { isNetworkErrorWithCode } from 'lib/get-network-error-code';
import { SignupCode } from 'types/signup-error-codes';

const Signup: React.FC = () => {
  const router = useRouter();
  const errorCode =
    useAppSelector((state) => state.user.signupErrorCode) ||
    arrayFirstOrSelf(router.query.error);
  const errorField = useAppSelector((state) => state.user.signupErrorField);
  const loginUrl = generateUrl('/login', router.query);
  const desktopPath = '/desktop';

  return (
    <Page name="Signup" title={titleTemplate('Sign up')}>
      <div className={css.signupWrapper}>
        <div className={css.signup}>
          <h2>Create account</h2>
          <SignupAlert customCopy />
          <ErrorBar code={errorCode} field={errorField} />
          <SignupForm desktopPath={desktopPath} />
        </div>
        <div className={cx(css.small, css.loginLink)}>
          Already have an account? <Link href={loginUrl}>Log in</Link>
        </div>
      </div>
    </Page>
  );
};

interface SignupFormProps {
  desktopPath: string;
}

const SignupForm: React.FC<SignupFormProps> = ({ desktopPath }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | undefined>();
  const [recaptchaRequired, setRecaptchaRequired] = useState(false);

  const key = arrayFirstOrSelf(router.query.key);
  const next = arrayFirstOrSelf(router.query.next);
  const nextQueryString = next ? `next=${encodeURIComponent(next)}` : '';

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    dispatch(
      UserActions.signup({
        email,
        password,
        recaptchaToken: recaptchaToken,
      }),
    )
      .unwrap()
      .then((response) => {
        if (key) {
          dispatch(LicenseActions.assignLicense(key)).unwrap();
          Tracking.trackEvent('Assigned license key', { flow: 'signup' });
        }

        Tracking.setUserId(response.user.id);
        // If the Chart Mogul customer was created successfully, set the user property
        if (response.user.chartMogulProfile) {
          Tracking.setUserProperties({
            ChartMogulProfile: `${response.user.chartMogulProfile['chartmogul-url']}`,
          });
        }
        Tracking.trackEvent('Signed up', {
          id: response.user.id,
          kind: 'creds',
        });
        router.push(key ? '/download-desktop' : next || desktopPath);
      })
      .catch((error) => {
        Tracking.trackEvent('Failed signing up', { error, kind: 'creds' });
        setPassword('');
        setIsLoading(false);

        if (
          isNetworkErrorWithCode(error) &&
          error.code === SignupCode.invalidRecaptchaToken
        ) {
          setRecaptchaRequired(true);
        }
      });
  };

  // TODO consider moving this to redux (but beware of stale data)
  useEffect(() => {
    getRecaptchaStatus()
      .then((result) => {
        setRecaptchaRequired(result.data.isRequired);
      })
      .catch(() => {
        setRecaptchaRequired(true);
      });
  }, []);

  return (
    <>
      <Button
        style="secondary"
        tone="base"
        size="large"
        fullWidth
        onClick={(event: React.MouseEvent<HTMLElement>) => {
          event.preventDefault();
          Tracking.trackEvent('Clicked continue with google', {
            flow: 'signup',
          });
          router.push(
            createApiUrl(`/auth/google?flow=signup&${nextQueryString}`),
          );
        }}
      >
        <div className={css.buttonContent}>
          <div className={css.buttonIcon}>
            <GoogleSVG />
          </div>
          <div>Continue with Google</div>
        </div>
      </Button>
      <Button
        style="secondary"
        tone="base"
        size="large"
        fullWidth
        href={`/login-saml`}
      >
        Sign in with SSO
      </Button>
      <div className={css.or}>
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
          isLoading={isLoading}
          data-testid="signup-button"
        >
          Sign up
        </Button>
        <div className={css.small}>
          By signing up, you agree to our{' '}
          <Link href="/terms">terms of use</Link> and{' '}
          <Link href="/privacy-policy">privacy policy</Link>
        </div>
      </form>
    </>
  );
};

interface SignupAlertProps {
  customCopy?: boolean;
}

const SignupAlert: React.FC<SignupAlertProps> = ({ customCopy }) => {
  const router = useRouter();
  const key = arrayFirstOrSelf(router.query.key);
  const next = arrayFirstOrSelf(router.query.next);

  if (key) {
    return (
      <MessageBanner type="info" title="Connect your account">
        <div className={css.message}>
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
            You need to log in or create an account to purchase Diffchecker
            Desktop
          </div>
        ) : (
          'You need to login or create an account to proceed to the next page'
        )}
      </MessageBanner>
    );
  }

  return null;
};

export default Signup;
