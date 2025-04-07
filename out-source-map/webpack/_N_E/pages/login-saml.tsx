import * as React from 'react';
import { type AxiosError } from 'axios';
import cx from 'classnames';
import Alert from 'components/alert';
import Button from 'components/shared/button';
import ErrorBar from 'components/error-bar';
import Floating from 'components/floating';
import Page from 'components/page';
import arrayFirstOrSelf from 'lib/array-first-or-self';
import createApiUrl from 'lib/create-api-url';
import titleTemplate from 'lib/title-template';
import { getIdByEmail } from 'models/organization-model';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

import css from './login-saml.module.css';

const LoginSAML: React.FC = () => {
  const router = useRouter();
  const next = arrayFirstOrSelf(router.query.next);
  const errorCode = arrayFirstOrSelf(router.query.error);
  const nextQueryString = `?next=${encodeURIComponent(next || '/')}`;
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email.length === 0) {
      return false;
    }
    setIsLoading(true);
    setErrorMessage(undefined);
    try {
      const res = await getIdByEmail(email);
      const url = createApiUrl(`/auth/saml/${res.data.id}${nextQueryString}`);
      router.push(url);
    } catch (error) {
      const message =
        (error as AxiosError).response?.status === 404
          ? 'Your account is not configured to use SAML SSO. Please log in with Google or a password.'
          : 'An error occurred. Please try again later.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    <Page name="Login with SAML">
      <Head>
        <title>{titleTemplate('Login with SAML')}</title>
      </Head>
      <Floating>
        <div className={css.login}>
          <h2>Sign in to Diffchecker with SAML SSO</h2>
          {next && (
            <Alert type="warning">
              You need to login to proceed to the next page
            </Alert>
          )}
          {errorMessage && <ErrorBar message={errorMessage} />}
          {errorCode && !errorMessage && <ErrorBar code={errorCode} />}
          <form onSubmit={handleSubmit} noValidate>
            <label>
              Email address
              <input
                type="email"
                className="email"
                value={email}
                placeholder="Email"
                onChange={handleEmailChange}
              />
            </label>
            <Button
              style="primary"
              tone="green"
              type="submit"
              fullWidth
              size="large"
              isLoading={isLoading}
              disabled={email.length === 0}
            >
              Sign in
            </Button>
          </form>
        </div>
      </Floating>
      <div className={cx(css.small, css.otherLogins)}>
        <Link href={`/login?${nextQueryString}`}>
          Login with Google or a password
        </Link>
      </div>
    </Page>
  );
};

export default LoginSAML;
