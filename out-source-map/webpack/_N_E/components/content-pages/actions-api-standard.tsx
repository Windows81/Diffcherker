import * as React from 'react';
import Link from 'next/link';
import Button from 'components/shared/button';
import css from './actions.module.css';
import Tracking from 'lib/tracking';
import { useSelector } from 'react-redux';
import { State } from 'redux/store';
import { isLoggedIn } from 'redux/selectors/user-selector';
import { API_MONTHLY_99 } from 'lib/plans';

const ActionsApiStandard = (): JSX.Element => {
  const isUserLoggedIn = useSelector((state: State) => isLoggedIn(state));

  const trackGetClick = () => {
    Tracking.trackEvent('Clicked get diffchecker', {
      type: 'buy',
      position: 'api-page',
    });
  };

  const planId = API_MONTHLY_99.id;
  const buyUrl = `/buy-public-api?planId=${planId}`;
  const href = isUserLoggedIn
    ? buyUrl
    : `/login?next=${encodeURIComponent(buyUrl)}`;

  return (
    <div className={css.container}>
      <div className={css.priceWrapper}>
        <div className={css.price}>${API_MONTHLY_99.price}</div>
        <div className={css.priceRate}>per month</div>
      </div>
      <div className={css.buttonWrapper}>
        <Link href={href}>
          <Button
            style="primary"
            tone="green"
            size="large"
            fullWidth
            onClick={trackGetClick}
          >
            Buy now
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ActionsApiStandard;
