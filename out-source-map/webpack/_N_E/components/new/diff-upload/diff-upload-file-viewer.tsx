import IconButton from 'components/shared/icon-button';
import CancelSvg from 'components/shared/icons/cancel.svg';
import DiffUploadFileInfo, {
  DiffUploadFileInfoProps,
} from './diff-upload-file-info';
import css from './diff-upload-file-viewer.module.css';
import cx from 'classnames';
import { DiffInputType } from 'types/diff-input-type';

type DiffUploadFileViewerProps = DiffUploadFileInfoProps & {
  handleClose: () => void;
  disableClose?: boolean;
  inputFileType?: DiffInputType;
};

const DiffUploadFileViewer: React.FC<
  React.PropsWithChildren<DiffUploadFileViewerProps>
> = ({ handleClose, disableClose, inputFileType, children, ...rest }) => {
  return (
    <div
      className={cx(css.container, {
        [css.hasChildren]: !!children,
      })}
    >
      <DiffUploadFileInfo {...rest} inputFileType={inputFileType}>
        <IconButton
          style="text"
          tone="base"
          svg={CancelSvg}
          aria-label={`Remove ${rest.filename}`}
          onClick={handleClose}
          disabled={disableClose}
        />
      </DiffUploadFileInfo>
      {children && (
        <>
          <div className={css.children}>{children}</div>
        </>
      )}
    </div>
  );
};

export default DiffUploadFileViewer;
