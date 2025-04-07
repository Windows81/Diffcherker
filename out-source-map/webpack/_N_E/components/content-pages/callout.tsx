import * as React from 'react';
import css from './api-callout.module.css';
import Button from 'components/shared/button';
import ArrowRightSvg from 'components/shared/icons/arrow-right.svg';
import Link from 'next/link';

interface CalloutProps {
  title: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
}

const Callout = ({
  title,
  description,
  buttonLabel,
  buttonHref,
}: CalloutProps): JSX.Element => {
  return (
    <div className={css.container}>
      <div className={css.text}>
        <h2 className={css.heading}>{title}</h2>
        <p className={css.paragraph}>{description}</p>
      </div>
      <div className={css.button}>
        <Link href={buttonHref}>
          <Button
            style="text"
            size="large"
            tone="base"
            iconEndSvg={ArrowRightSvg}
          >
            {buttonLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Callout;
