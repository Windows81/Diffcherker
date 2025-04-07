import * as UserActions from 'redux/modules/user-module';
import Button from 'components/button';
import ErrorBar from 'components/error-bar';
import Floating from 'components/floating';
import Page from 'components/page';
import Messages from 'lib/messages';
import titleTemplate from 'lib/title-template';
import Head from 'next/head';
import Router from 'next/router';
import React, { useRef } from 'react';
import { State, useAppDispatch, useAppSelector } from 'redux/store';
import { isFulfilled } from '@reduxjs/toolkit';

interface ResetPasswordProps {
  errorCode: string;
  errorField: string;
}

const ResetPassword: React.FC<ResetPasswordProps> = () => {
  const user = useAppSelector((state: State) => state.user);
  const passwordRef = useRef<HTMLInputElement>(null);

  const dispatch = useAppDispatch();
  const handleSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const password = passwordRef.current?.value;
    const split = window.location.href.split('/');
    const code = window ? split[split.length - 2] : '';
    if (code) {
      dispatch(
        UserActions.confirmResetPassword({
          code,
          password,
        }),
      )
        .then((action) => {
          if (isFulfilled(action)) {
            Router.push('/');
          }
        })
        .catch(() => undefined);
    }
  };
  return (
    <Page name="Reset Password">
      <Head>
        <title>{titleTemplate('Reset Password')}</title>
      </Head>
      <Floating>
        <div className="reset-password">
          <h2>Reset Password</h2>
          <ErrorBar
            code={user.confirmResetPasswordErrorCode}
            field={user.confirmResetPasswordErrorField}
          />
          {user.code ? (
            <Messages code={user.code} />
          ) : (
            <div>
              <p>Please fill out the form below to reset your password.</p>
              <form className="reset-password-form" onSubmit={handleSubmit}>
                <input
                  type="password"
                  ref={passwordRef}
                  placeholder="Enter new password"
                />
                <Button
                  type="brand"
                  buttonType="submit"
                  fullWidth
                  style={{
                    marginTop: 10,
                  }}
                >
                  Change Password
                </Button>
              </form>
            </div>
          )}
        </div>
      </Floating>
      <style jsx>{`
        .reset-password .button {
          width: 100%;
        }
        .reset-password form,
        .reset-password form input {
          margin-top: 10px;
        }
      `}</style>
    </Page>
  );
};

export default ResetPassword;
