import * as React from 'react';

import Modal, { makeStateless } from 'components/shared/modal';
import css from './modal.module.css';
import { FC, useState } from 'react';
import AuthGoogleButton from './google-button';
import Button from 'components/shared/button';
import AuthSignupForm from './signup-form';
import AuthSigninForm from './signin-form';
import Link from 'next/link';
import Divider from 'components/shared/divider';
import { User } from 'types/user';

interface AuthModalModalProps {
  isOpen: boolean;
  closeModal: () => void;
  didClose: () => void;
  onAuthenticated?: (user: User) => void;
  onSignedIn?: (user: User) => void;
  onSignedUp?: (user: User) => void;
  oauthRedirect?: string;
}

const AuthModalTermsOfUseText: FC = () => {
  return (
    <p>
      By signing up, you agree to our{' '}
      <a className="anchor-style" href="/terms/" target="_blank">
        Terms of use
      </a>{' '}
      and{' '}
      <a className="anchor-style" href="/privacy-policy/" target="_blank">
        Privacy policy
      </a>
    </p>
  );
};

const AuthModal: FC<AuthModalModalProps> = ({
  isOpen,
  closeModal,
  didClose,
  onSignedIn = () => {
    /* noop */
  },
  onSignedUp = () => {
    /* noop */
  },
  onAuthenticated = () => {
    /* noop */
  },
}) => {
  const [authStep, setAuthStep] = useState<'signup' | 'signin'>('signup');
  const [showForm, setShowForm] = useState<'signup' | 'signin' | undefined>();

  return (
    <Modal
      isOpen={isOpen}
      closeModal={closeModal}
      didClose={didClose}
      minWidth="355px"
    >
      <div className={css.innerContainer}>
        {authStep === 'signup' && (
          <>
            <h2 className={css.heading}>Sign up to continue</h2>
            <div className={css.buttons}>
              <AuthGoogleButton />
              {showForm !== 'signup' && (
                <Button
                  size="large"
                  tone="base"
                  style="secondary"
                  fullWidth
                  onClick={() => setShowForm('signup')}
                >
                  Sign up with email
                </Button>
              )}
            </div>
            <div className={css.sso}>
              <Link
                href={`/login-saml/?next=${window.location.pathname}`}
                className="anchor-style"
              >
                Use single sign-on
              </Link>
            </div>
          </>
        )}
        {authStep === 'signin' && (
          <>
            <h2 className={css.heading}>Sign in to continue</h2>
            <div className={css.buttons}>
              <AuthGoogleButton />
              {showForm !== 'signin' && (
                <Button
                  size="large"
                  tone="base"
                  style="secondary"
                  fullWidth
                  onClick={() => setShowForm('signin')}
                >
                  Sign in with email
                </Button>
              )}
            </div>
            <div className={css.sso}>
              <Link
                href={`/login-saml/?next=${window.location.pathname}`}
                className="anchor-style"
              >
                Use single sign-on
              </Link>
            </div>
          </>
        )}
        {!!showForm && <Divider label="OR" />}
        {showForm === 'signup' && (
          <AuthSignupForm
            onSignedUp={(user) => {
              onSignedUp(user);
              onAuthenticated(user);
            }}
          />
        )}
        {showForm === 'signin' && (
          <AuthSigninForm
            onSignedIn={(user) => {
              onAuthenticated(user);
              onSignedIn(user);
            }}
          />
        )}

        {authStep === 'signup' && <AuthModalTermsOfUseText />}
        <div className={css.authStepSwitcher}>
          {authStep === 'signup' && (
            <p>
              Already have an account?{' '}
              <button
                className="anchor-style"
                onClick={() => {
                  setAuthStep('signin');
                  setShowForm(undefined);
                }}
              >
                Sign in
              </button>
            </p>
          )}
          {authStep === 'signin' && (
            <p>
              {`Don't have an account? `}
              <button
                className="anchor-style"
                onClick={() => {
                  setAuthStep('signup');
                  setShowForm(undefined);
                }}
              >
                Sign up
              </button>
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default makeStateless(AuthModal);
