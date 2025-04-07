import * as React from 'react';
import Button from 'components/shared/button';
import css from './actions.module.css';
import cx from 'classnames';

const ActionsApiEnterprise = (): JSX.Element => {
  return (
    <div className={css.container}>
      <div className={css.priceWrapper}>
        <div className={cx(css.price, css.priceSecondary)}>Custom</div>
        <div className={css.priceRate}></div>
      </div>
      <div className={css.buttonWrapper}>
        <Button
          style="secondary"
          tone="base"
          size="large"
          fullWidth
          href="/contact"
        >
          Contact us
        </Button>
      </div>
    </div>
  );
};

export default ActionsApiEnterprise;
