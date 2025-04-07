import { Field } from 'components/shared/form/field';
import TextInput from 'components/shared/form/text-input';
import { FC, useCallback, useState } from 'react';
import css from './signin-form.module.css';
import Button from 'components/shared/button';
import Tracking from 'lib/tracking';
import { useAppDispatch } from 'redux/store';
import * as UserActions from 'redux/modules/user-module';
import { User } from 'types/user';
import { normalizeError } from 'lib/messages';
import MessageBanner from 'components/shared/message-banner';

type AuthSigninFormProps = {
  onSignedIn?: (user: User) => void;
};

const AuthSigninForm: FC<AuthSigninFormProps> = ({
  onSignedIn = () => {
    /* noop */
  },
}) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<Error | undefined>();
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  const dispatch = useAppDispatch();

  const signin = useCallback(
    (email: string, password: string) => {
      setIsSigningIn(true);
      Tracking.trackEvent('Submitted login form');
      setIsSigningIn(true);
      dispatch(UserActions.login({ email, password }))
        .unwrap()
        .then((response) => {
          Tracking.setUserId(response.user.id);
          Tracking.trackEvent('Logged in', {
            id: response.user.id,
            kind: 'creds - modal',
          });
          onSignedIn(response.user);
        })
        .catch((error) => {
          setError(normalizeError(error));
          Tracking.trackEvent('Failed logging in', {
            error,
            kind: 'creds - modal',
          });
        })
        .finally(() => {
          setIsSigningIn(false);
          setPassword('');
        });
    },
    [dispatch, onSignedIn],
  );

  return (
    <form
      className={css.signinForm}
      onSubmit={(ev) => {
        signin(email, password);
        ev.preventDefault();
      }}
    >
      <Field label="Email address">
        <TextInput
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          required
        />
      </Field>
      <Field label="Password">
        <TextInput
          type="password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          required
        />
      </Field>
      <div className={css.resetPassword}>
        <a className="anchor-style" href="/forgot-password/" target="_blank">
          Forgot password?
        </a>
      </div>
      {error && (
        <MessageBanner
          className={css.errorBanner}
          type="error"
          title={error.message}
        />
      )}
      <div className={css.submitButton}>
        <Button
          type="submit"
          style="primary"
          tone="green"
          fullWidth
          size="large"
          isLoading={isSigningIn}
        >
          Sign in
        </Button>
      </div>
    </form>
  );
};

export default AuthSigninForm;
