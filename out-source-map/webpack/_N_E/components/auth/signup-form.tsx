import { Field } from 'components/shared/form/field';
import TextInput from 'components/shared/form/text-input';
import { FC, useCallback, useEffect, useState } from 'react';
import css from './signup-form.module.css';
import Button from 'components/shared/button';
import { useAppDispatch } from 'redux/store';
import * as UserActions from 'redux/modules/user-module';
import Tracking from 'lib/tracking';
import { User } from 'types/user';
import { normalizeError } from 'lib/messages';
import MessageBanner from 'components/shared/message-banner';
import ReCAPTCHA from 'react-google-recaptcha';
import { getRecaptchaStatus } from 'models/user-model';
import { isNetworkErrorWithCode } from 'lib/get-network-error-code';
import { SignupCode } from 'types/signup-error-codes';

type AuthSignupFormProps = {
  showName?: boolean;
  requireName?: boolean;
  onSignedUp?: (user: User) => void;
};

const AuthSignupForm: FC<AuthSignupFormProps> = ({
  showName = true,
  requireName = true,
  onSignedUp = () => {
    /* noop */
  },
}) => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<Error | undefined>();
  const [isSigningUp, setIsSigningUp] = useState<boolean>(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | undefined>();
  const [recaptchaRequired, setRecaptchaRequired] = useState(false);

  const dispatch = useAppDispatch();

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      setIsSigningUp(true);

      dispatch(UserActions.signup({ name, email, password, recaptchaToken }))
        .unwrap()
        .then((response) => {
          Tracking.setUserId(response.user.id);
          Tracking.trackEvent('Signed up', {
            id: response.user.id,
            kind: 'creds - modal',
          });
          onSignedUp(response.user);
        })
        .catch((error) => {
          setError(normalizeError(error));
          Tracking.trackEvent('Failed signing up', {
            error,
            kind: 'creds - modal',
          });

          if (
            isNetworkErrorWithCode(error) &&
            error.code === SignupCode.invalidRecaptchaToken
          ) {
            setRecaptchaRequired(true);
          }
        })
        .finally(() => {
          setIsSigningUp(false);
          setPassword('');
        });
    },
    [dispatch, onSignedUp, recaptchaToken],
  );

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
    <form
      className={css.signupForm}
      onSubmit={(ev) => {
        ev.preventDefault();
        signup(name, email, password);
      }}
    >
      {showName && (
        <Field label="Name">
          <TextInput
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            required={requireName}
          />
        </Field>
      )}
      <Field label="Email address">
        <TextInput
          value={email}
          type="email"
          onChange={(ev) => setEmail(ev.target.value)}
          required
        />
      </Field>
      <Field label="Password">
        <TextInput
          placeholder="Create password"
          type="password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          required
          minLength={4}
          maxLength={255}
        />
      </Field>
      {error && (
        <MessageBanner
          className={css.errorBanner}
          type="error"
          title={error.message}
        />
      )}
      {recaptchaRequired && (
        <div className={css.recaptcha}>
          <ReCAPTCHA
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string}
            onChange={(token) => setRecaptchaToken(token ?? undefined)}
            className={css.recaptcha}
          />
        </div>
      )}
      <div className={css.submitButton}>
        <Button
          type="submit"
          style="primary"
          tone="green"
          fullWidth
          size="large"
          isLoading={isSigningUp}
        >
          Sign up
        </Button>
      </div>
    </form>
  );
};

export default AuthSignupForm;
