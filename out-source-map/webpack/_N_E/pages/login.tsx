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
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store';
import GoogleSVG from 'static/images/google.svg';

import css from './login.module.css';
import TextInput from 'components/shared/form/text-input';
import MessageBanner from 'components/shared/message-banner';

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const errorCode =
    useAppSelector((state) => state.user.loginErrorCode) ||
    arrayFirstOrSelf(router.query.error);
  const errorField = useAppSelector((state) => state.user.loginErrorField);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const key = arrayFirstOrSelf(router.query.key);
  const next = arrayFirstOrSelf(router.query.next);
  const nextQueryString = next ? `next=${encodeURIComponent(next)}` : '';
  const signupUrl = generateUrl('/signup', router.query);
  const [isLoading, setisLoading] = useState(false);

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    Tracking.trackEvent('Submitted login form');
    setisLoading(true);
    dispatch(UserActions.login({ email, password }))
      .unwrap()
      .then((response) => {
        if (key) {
          dispatch(LicenseActions.assignLicense(key)).unwrap();
          Tracking.trackEvent('Assigned license key', { flow: 'login' });
        }
        Tracking.setUserId(response.user.id);
        Tracking.trackEvent('Logged in', {
          id: response.user.id,
          kind: 'creds',
        });
        router.push(key ? '/download-desktop' : next || '/');
      })
      .catch((error) => {
        Tracking.trackEvent('Failed logging in', { error, kind: 'creds' });
        setisLoading(false);
        setPassword('');
      });
  };

  return (
    <Page name="Login" title={titleTemplate('Login')}>
      <div className={css.loginWrapper}>
        <div className={css.login}>
          <h2>Sign in to Diffchecker</h2>
          {key && (
            <MessageBanner type="info" title="Connect your account">
              <div className={css.message}>
                <p>
                  Sign up or log in now to connect your Diffchecker Desktop
                  purchase to your account.
                </p>
                <p>Thank you for buying Diffchecker Desktop!</p>
              </div>
            </MessageBanner>
          )}
          {next && (
            <MessageBanner type="info" title="Log in or sign up to continue">
              You need to login or create an account to proceed to the next page
            </MessageBanner>
          )}
          <ErrorBar code={errorCode} field={errorField} />
          <Button
            style="secondary"
            tone="base"
            size="large"
            fullWidth
            onClick={(event: React.MouseEvent<HTMLElement>) => {
              event.preventDefault();
              Tracking.trackEvent('Clicked continue with google', {
                flow: 'login',
              });
              router.push(
                createApiUrl(`/auth/google?flow=login&${nextQueryString}`),
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
            href={`/login-saml?${nextQueryString}`}
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
                onChange={handleEmailChange}
              />
            </label>
            <div>
              <label>
                Password
                <TextInput
                  type="password"
                  className="password"
                  value={password}
                  onChange={handlePasswordChange}
                />
              </label>
              <p className={css.small}>
                <Link href="/forgot-password">Reset password</Link>
              </p>
            </div>
            <Button
              style="primary"
              tone="green"
              type="submit"
              fullWidth
              size="large"
              isLoading={isLoading}
              data-testid="signin-button"
            >
              Sign in
            </Button>
          </form>
        </div>
        <div className={cx(css.small, css.signupLink)}>
          Don&apos;t have an account? <Link href={signupUrl}>Sign up</Link>
        </div>
      </div>
    </Page>
  );
};

export default Login;
