import Button from 'components/shared/button';
import Tracking from 'lib/tracking';
import css from './desktop-modal-buttons.module.css';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { State } from 'redux/store';
import { isLoggedIn } from 'redux/selectors/user-selector';

interface DesktopModalButtonsProProps {
  closeModal?: () => void;
}

const DesktopModalButtonsPro: React.FC<DesktopModalButtonsProProps> = ({
  closeModal,
}) => {
  const onClickLearnMore = () => {
    closeModal?.();
    Tracking.trackEvent('Clicked learn more', {
      position: 'desktop-modal-buttons-pro',
    });
  };

  const onClickGetDiffchecker = () => {
    closeModal?.();
    Tracking.trackEvent('Clicked get diffchecker', {
      type: 'buy',
      position: 'desktop-modal-buttons-pro',
    });
  };

  const isUserLoggedIn = useSelector((state: State) => isLoggedIn(state));

  return (
    <div className={css.wrapper}>
      <div className={css.buttonWrapper}>
        <Button
          style="primary"
          tone="green"
          size="large"
          fullWidth
          href={
            isUserLoggedIn
              ? `/buy-desktop?term=yearly`
              : `/signup?next=/buy-desktop?term=yearly`
          }
          onClick={onClickGetDiffchecker}
          nextLink
        >
          Upgrade now
        </Button>
        <p className={css.textSecondary}>
          or{' '}
          <Link
            className={css.link}
            href="/pro-features"
            onClick={onClickLearnMore}
          >
            learn more
          </Link>
        </p>
      </div>
      <p className={css.textSecondary}>Cancel anytime</p>
    </div>
  );
};

export default DesktopModalButtonsPro;
