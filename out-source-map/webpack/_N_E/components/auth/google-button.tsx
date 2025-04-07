import { FC } from 'react';
import Button from 'components/shared/button';
import Tracking from 'lib/tracking';
import GoogleSVG from 'static/images/google.svg';
import { useRouter } from 'next/router';
import css from './google-button.module.css';
import createApiUrl from 'lib/create-api-url';

type AuthGoogleButtonProps = {
  redirect?: string;
};

const AuthGoogleButton: FC<AuthGoogleButtonProps> = ({
  redirect = window.location.href,
}) => {
  const router = useRouter();

  return (
    <Button
      style="primary"
      tone="green"
      size="large"
      fullWidth
      onClick={(event: React.MouseEvent<HTMLElement>) => {
        const nextQueryString = `next=${encodeURIComponent(redirect)}`;
        event.preventDefault();
        Tracking.trackEvent('Clicked continue with google', {
          flow: 'login',
        });
        router.push(createApiUrl(`/auth/google?flow=login&${nextQueryString}`));
      }}
    >
      <span className={css.buttonContent}>
        <span className={css.buttonIcon}>
          <GoogleSVG />
        </span>
        <span>Continue with Google</span>
      </span>
    </Button>
  );
};

export default AuthGoogleButton;
