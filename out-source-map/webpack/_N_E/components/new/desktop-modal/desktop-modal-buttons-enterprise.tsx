import Button from 'components/shared/button';
import Tracking from 'lib/tracking';
import css from './desktop-modal-buttons.module.css';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { State } from 'redux/store';
import { isLoggedIn } from 'redux/selectors/user-selector';

interface DesktopModalButtonsEnterpriseProps {
  closeModal?: () => void;
}

const DesktopModalButtonsEnterprise: React.FC<
  DesktopModalButtonsEnterpriseProps
> = ({ closeModal }) => {
  const onClickGetDiffchecker = () => {
    closeModal?.();
    Tracking.trackEvent('Clicked get diffchecker', {
      type: 'buy',
      position: 'desktop-modal-buttons-enterprise',
    });
  };

  const onClickContactUs = () => {
    closeModal?.();
  };

  const isUserLoggedIn = useSelector((state: State) => isLoggedIn(state));

  return (
    <div className={css.wrapper}>
      <div className={css.buttonWrapper}>
        <Button
          style="primary"
          tone="base"
          size="large"
          fullWidth
          href={
            isUserLoggedIn ? `/buy-enterprise` : `/signup?next=/buy-enterprise`
          }
          onClick={onClickGetDiffchecker}
          nextLink
        >
          Upgrade now
        </Button>
        <p className={css.textSecondary}>
          or{' '}
          <Link className={css.link} href="/contact" onClick={onClickContactUs}>
            contact us
          </Link>
        </p>
      </div>
      <p className={css.textSecondary}>Annual billing only</p>
    </div>
  );
};

export default DesktopModalButtonsEnterprise;
