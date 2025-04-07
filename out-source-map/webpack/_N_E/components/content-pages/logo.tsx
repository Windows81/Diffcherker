import * as React from 'react';
import css from './logo.module.css';

interface CtaProps {
  label?: string;
  isLabelGreen?: boolean;
  isLarge?: boolean;
}

const Logo = ({ label, isLabelGreen, isLarge }: CtaProps): JSX.Element => {
  return (
    <div className={isLarge ? css.logoLarge : css.logo}>
      <img
        src="/static/images/new/diffchecker.svg"
        alt="Diffchecker logo"
        className={css.image}
      />
      <div className={css.text}>
        <span className={css.green}>Diff</span>checker
        {label && (
          <span className={isLabelGreen ? css.green : ''}>{` ${label}`}</span>
        )}
      </div>
    </div>
  );
};

export default Logo;
