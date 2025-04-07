import formatFileSize from 'lib/format-file-size';
import css from './diff-upload-file-info.module.css';
import Icon from 'components/shared/icon';
import { DiffInputType } from 'types/diff-input-type';
import cx from 'classnames';

export type DiffUploadFileInfoProps = {
  svg?: React.FC<React.SVGProps<SVGSVGElement>>;
  filename: string;
  fileSize?: number;
  filePath?: string;
  inputFileType?: DiffInputType;
};

const DiffUploadFileInfo: React.FC<
  React.PropsWithChildren<DiffUploadFileInfoProps>
> = ({ svg, filename, fileSize, filePath, inputFileType, children }) => {
  const shownFilePath = filePath?.replace(filename, '');
  return (
    <div className={css.info}>
      {svg && <Icon size="xl" svg={svg} />}
      <div
        className={cx(css.text, {
          [css.wordBreak]: inputFileType === DiffInputType.FOLDER,
        })}
      >
        <div className={css.filename} title={filename}>
          {filename}
        </div>
        {fileSize !== undefined && (
          <div className={css.fileSize} title={shownFilePath}>
            {shownFilePath || formatFileSize(fileSize, 2)}
          </div>
        )}
      </div>
      {children && <div className={css.children}>{children}</div>}
    </div>
  );
};

export default DiffUploadFileInfo;
