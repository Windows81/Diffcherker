import * as React from 'react';
import enableFullstory from 'lib/enable-fullstory';
import Tracking from 'lib/tracking';
import Button, { StyledButtonProps } from 'components/shared/button';
import { TRIAL_LENGTH_IN_DAYS } from 'types/constants';
import ArrowRightSvg from 'components/shared/icons/arrow-right.svg';
import css from './cta.module.css';

interface CtaProps {
  url: string;
  showPricing?: boolean;
  position: string;
  tone?: StyledButtonProps['tone'];
}

const buttonTypes = {
  TRIAL: 'trial',
  BUY: 'buy',
};

const Cta = ({
  url,
  showPricing,
  position,
  tone = 'green',
}: CtaProps): JSX.Element => {
  const trackGetClick = (params: { type: string; position: string }) => {
    Tracking.trackEvent('Clicked get diffchecker', params);
    if (params.type === buttonTypes.BUY) {
      enableFullstory();
    }
  };

  return (
    <div className={css.heroButtons}>
      <div className={css.buttonContainer}>
        <Button
          style="primary"
          tone={tone}
          size="xl"
          href={url}
          fullWidth
          onClick={() => {
            trackGetClick({
              type: buttonTypes.TRIAL,
              position: position,
            });
          }}
          nextLink
        >
          Try for Free!
        </Button>
        <div className={css.buttonContainerFinePrint}>
          <p className={css.finePrint}>{TRIAL_LENGTH_IN_DAYS}-day trial</p>
          <p className={css.finePrint}>No credit card required</p>
        </div>
      </div>
      {showPricing && (
        <div className={css.buttonContainer}>
          <Button
            style="secondary"
            tone="base"
            size="xl"
            fullWidth
            iconEndSvg={ArrowRightSvg}
            href="/pricing"
            nextLink
          >
            View pricing
          </Button>
        </div>
      )}
    </div>
  );
};

export default Cta;
