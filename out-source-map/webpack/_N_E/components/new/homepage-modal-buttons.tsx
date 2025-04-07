import Button from 'components/shared/button';
import Tracking from 'lib/tracking';
import css from './homepage-modal-buttons.module.css';
import { TRIAL_LENGTH_IN_DAYS } from 'types/constants';

interface HomepageModalButtonsProps {
  position: string;
}

const HomepageModalButtons: React.FC<HomepageModalButtonsProps> = ({
  position,
}) => {
  const onClickLearnMore = () => {
    Tracking.trackEvent('Clicked learn more', { position });
  };

  const onClickGetTrial = () => {
    Tracking.trackEvent('Clicked get diffchecker', { type: 'trial', position });
  };

  return (
    <div className={css.buttons}>
      <div className={css.buttonWrapper}>
        <Button
          style="secondary"
          tone="base"
          size="large"
          fullWidth
          href="/desktop"
          onClick={onClickLearnMore}
          nextLink
        >
          Learn more
        </Button>
      </div>
      <div className={css.try}>
        <Button
          style="primary"
          tone="green"
          size="large"
          fullWidth
          href="/download-trial"
          onClick={onClickGetTrial}
          className={css.button}
          nextLink
        >
          Download Desktop App
        </Button>
        {TRIAL_LENGTH_IN_DAYS} day trial, no credit card required
      </div>
    </div>
  );
};

export default HomepageModalButtons;
