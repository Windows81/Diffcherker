import css from './diff-upload-drop-container.module.css';
import cx from 'classnames';

interface DiffUploadDropContainerProps {
  isDropzone: boolean;
}

const DiffUploadDropContainer: React.FC<
  React.PropsWithChildren<DiffUploadDropContainerProps>
> = ({ isDropzone, children }) => {
  return (
    <div
      className={cx(css.container, {
        [css.notDropzone]: !isDropzone,
      })}
    >
      {isDropzone ? children : <div className={css.center}>{children}</div>}
    </div>
  );
};

export default DiffUploadDropContainer;
