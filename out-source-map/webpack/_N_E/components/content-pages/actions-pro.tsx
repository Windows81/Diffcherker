import * as React from 'react';
import Link from 'next/link';
import Button from 'components/shared/button';
import css from './actions.module.css';
import enableFullstory from 'lib/enable-fullstory';
import Tracking from 'lib/tracking';
import { useSelector } from 'react-redux';
import { State } from 'redux/store';
import { isLoggedIn } from 'redux/selectors/user-selector';

const buttonTypes = {
  TRIAL: 'trial',
  BUY: 'buy',
};

interface ActionsProProps {
  billing: 'monthly' | 'yearly';
  showFooter?: boolean;
}

const ActionsPro = ({ billing, showFooter }: ActionsProProps): JSX.Element => {
  const hasLicense = useSelector((state: State) => !!state.user.user?.license);
  const isUserLoggedIn = useSelector((state: State) => isLoggedIn(state));

  const trackGetClick = (params: { type: string; position: string }) => {
    Tracking.trackEvent('Clicked get diffchecker', params);
    if (params.type === buttonTypes.BUY) {
      enableFullstory();
    }
  };

  return hasLicense ? (
    <div className={css.container}>
      <div className={css.buttonWrapper}>
        <Link
          href={
            isUserLoggedIn
              ? `/buy-desktop?term=${billing}`
              : `/signup?next=/buy-desktop?term=${billing}`
          }
        >
          <Button
            style="primary"
            tone="green"
            size="large"
            fullWidth
            onClick={() => {
              trackGetClick({
                type: buttonTypes.BUY,
                position: 'table',
              });
            }}
          >
            Upgrade now
          </Button>
        </Link>
        {showFooter && <p className={css.textSecondary}>Cancel anytime</p>}
      </div>
      {showFooter && (
        <p className={css.textSecondary}>Monthly or yearly billing</p>
      )}
    </div>
  ) : (
    <div className={css.container}>
      <div className={css.buttonWrapper}>
        <Link href="/download-trial">
          <Button
            style="primary"
            tone="green"
            size="large"
            fullWidth
            onClick={() => {
              trackGetClick({
                type: buttonTypes.TRIAL,
                position: 'table',
              });
            }}
          >
            Try for free
          </Button>
        </Link>
        {showFooter && (
          <p className={css.textSecondary}>
            or{' '}
            <Link
              className={css.link}
              href={
                isUserLoggedIn
                  ? `/buy-desktop?term=${billing}`
                  : `/signup?next=/buy-desktop?term=${billing}`
              }
            >
              buy now
            </Link>
          </p>
        )}
      </div>
      {showFooter && <p className={css.textSecondary}>Cancel anytime</p>}
    </div>
  );
};

export default ActionsPro;
