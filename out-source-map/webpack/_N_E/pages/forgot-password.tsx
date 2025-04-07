import * as UserActions from 'redux/modules/user-module';
import Button from 'components/shared/button';
import ErrorBar from 'components/error-bar';
import Floating from 'components/floating';
import Page from 'components/new/page';
import Messages from 'lib/messages';
import titleTemplate from 'lib/title-template';
import Head from 'next/head';
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store';

import css from './forgot-password.module.css';
import TextInput from 'components/shared/form/text-input';

const ForgotPassword: React.FC = () => {
  const dispatch = useAppDispatch();
  const code = useAppSelector((state) => state.user.code);
  const errorCode = useAppSelector(
    (state) => state.user.resetPasswordErrorCode,
  );
  const errorField = useAppSelector(
    (state) => state.user.resetPasswordErrorField,
  );
  const [email, setEmail] = useState('');

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(UserActions.resetPassword({ email }));
  };

  return (
    <Page name="Forgot Password" title={titleTemplate('Forgot Password')}>
      <Head>
        <title>{titleTemplate('Forgot Password')}</title>
      </Head>
      <Floating>
        <div className={css.forgotPassword}>
          <h2 className={css.title}>Reset password</h2>
          <ErrorBar code={errorCode} field={errorField} />
          {code ? (
            <p>
              <Messages code={code} />
            </p>
          ) : (
            <div>
              <form className={css.form} onSubmit={handleSubmit}>
                <label className={css.label}>
                  Email address
                  <TextInput
                    type="email"
                    value={email}
                    placeholder="Email address"
                    onChange={handleEmailChange}
                  />
                </label>
                <Button
                  style="primary"
                  tone="green"
                  type="submit"
                  fullWidth
                  size="large"
                >
                  Reset Password
                </Button>
              </form>
            </div>
          )}
        </div>
      </Floating>
    </Page>
  );
};

export default ForgotPassword;
