import css from './diff-upload-header.module.css';
import FileDiffUploadButton, {
  FileUploadButtonProps,
} from '../file-diff-upload-button';
import Button from 'components/shared/button';
import EditSvg from 'components/shared/icons/edit.svg';
import { t } from 'lib/react-tiny-i18n';

type DiffUploadHeaderEditableProps = FileUploadButtonProps & {
  text?: string;
  handleEdit: () => void;
};

const DiffUploadHeaderEditable: React.FC<DiffUploadHeaderEditableProps> = ({
  svg,
  filename,
  text,
  handleEdit,
  ...rest
}) => {
  return (
    <div className={css.header}>
      <div className={css.fileSection}>
        <FileDiffUploadButton svg={svg} filename={filename} {...rest} />
      </div>
      {text && <div className={css.text}>{text}</div>}
      <div className={css.button}>
        <Button
          style="secondary"
          tone="base"
          iconStartSvg={EditSvg}
          className={css.editButton}
          onClick={handleEdit}
          disabled={rest.disabled}
        >
          {t('DiffEditorHeader.editDiff')}
        </Button>
      </div>
    </div>
  );
};

export default DiffUploadHeaderEditable;
