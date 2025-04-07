import * as React from 'react';
import Link from 'next/link';
import Button from 'components/shared/button';
import css from './actions.module.css';
import { useSelector } from 'react-redux';
import { State } from 'redux/store';
import { isLoggedIn } from 'redux/selectors/user-selector';

interface ActionsEnterpriseProps {
  showFooter?: boolean;
}

const ActionsEnterprise = ({
  showFooter,
}: ActionsEnterpriseProps): JSX.Element => {
  const isUserLoggedIn = useSelector((state: State) => isLoggedIn(state));

  return (
    <div className={css.container}>
      <div className={css.buttonWrapper}>
        <Link
          href={
            isUserLoggedIn ? `/buy-enterprise` : `/signup?next=/buy-enterprise`
          }
        >
          <Button style="primary" tone="base" size="large" fullWidth>
            Upgrade now
          </Button>
        </Link>
        {showFooter && (
          <p className={css.textSecondary}>
            or{' '}
            <Link className={css.link} href="/contact">
              contact us
            </Link>
          </p>
        )}
      </div>
      {showFooter && <p className={css.textSecondary}>Annual billing only</p>}
    </div>
  );
};

export default ActionsEnterprise;
