import css from './pdf-password.module.css';
import cx from 'classnames';
import Icon from 'components/shared/icon';
import LockSvg from 'components/shared/icons/lock.svg';
import DiffUploadPassword, {
  DiffUploadPasswordProps,
} from 'components/new/diff-upload/diff-upload-password';

type PdfPasswordProps = DiffUploadPasswordProps;

const PdfPassword: React.FC<PdfPasswordProps> = (props) => {
  const shouldShowIncorrect = props.isIncorrect && !props.isLoading;

  return (
    <div className={cx(css.container, { [css.error]: shouldShowIncorrect })}>
      <div className={css.prompt}>
        <Icon svg={LockSvg} size="small" />
        <div className={css.description}>
          This document is password protected
        </div>
      </div>
      <div className={css.inputSection}>
        <DiffUploadPassword {...props} />
        {shouldShowIncorrect && (
          <div className={css.incorrectText}>Incorrect password</div>
        )}
      </div>
    </div>
  );
};

export default PdfPassword;
