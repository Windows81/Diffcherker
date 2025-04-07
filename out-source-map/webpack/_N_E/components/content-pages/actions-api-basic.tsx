import * as React from 'react';
import Button from 'components/shared/button';
import css from './actions.module.css';
import cx from 'classnames';

const ActionsApiBasic = (): JSX.Element => {
  return (
    <div className={css.container}>
      <div className={css.priceWrapper}>
        <div className={cx(css.price, css.priceSecondary)}>Free</div>
        <div className={css.priceRate}></div>
      </div>
      <div className={css.buttonWrapper}>
        <Button
          style="secondary"
          tone="base"
          size="large"
          fullWidth
          href="/docs/getting-started"
        >
          Go to docs
        </Button>
      </div>
    </div>
  );
};

export default ActionsApiBasic;
