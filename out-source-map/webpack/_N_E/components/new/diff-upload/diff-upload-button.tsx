import Button, { StyledButtonProps } from 'components/shared/button';
import UploadSvg from 'components/shared/icons/upload.svg';
import { useCallback, useRef } from 'react';
import { DiffInputType } from 'types/diff-input-type';
import { DiffSide } from 'types/diffSide';
import css from './diff-upload-button.module.css';
import cx from 'classnames';
import { t } from 'lib/react-tiny-i18n';

export interface DiffUploadButtonProps {
  label: string;
  acceptedFileTypes: string[];
  side: DiffSide;
  type: DiffInputType;
  handleFileUpload?: (file: File) => void;
  handleFolderUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  style?: StyledButtonProps['style'];
  tone?: StyledButtonProps['tone'];
  fullWidth?: boolean;
  disabled?: boolean;
}

const DiffUploadButton: React.FC<
  React.PropsWithChildren<DiffUploadButtonProps>
> = ({
  label,
  acceptedFileTypes,
  side,
  type,
  handleFileUpload,
  handleFolderUpload,
  style = 'text',
  tone = 'base',
  fullWidth,
  children,
  disabled,
}) => {
  const fileInput = useRef<HTMLInputElement>(null);

  const onInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (handleFolderUpload) {
        handleFolderUpload(event);
        return;
      }

      if (!event.target || !event.target.files || !handleFileUpload) {
        return;
      }
      const files = event.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        handleFileUpload(file);
        event.target.value = '';
      } else {
        console.error(`No files uploaded to ${side} DiffUploadDropzone!`);
      }
    },
    [handleFileUpload, handleFolderUpload, side],
  );

  // when the files are the same name, clicking the input header to change the right side
  // will populate the left one if they are not differentiated
  const inputName = `file${label.replace(' ', '-')}${side}}`;

  return (
    <div className={cx(css.wrapper, fullWidth && css.fullWidth)}>
      <label className={css.container} aria-label={`${label} upload`}>
        <input
          type="file"
          webkitdirectory={type === DiffInputType.FOLDER ? 'true' : undefined}
          className={css.fileInput}
          id={inputName}
          accept={acceptedFileTypes.join(',')}
          onChange={onInputChange}
          ref={fileInput}
          disabled={disabled}
        />
        {
          /* note that a button placed here should be a fake button, ie. span with cursor: pointer, since the label & input handle the focus and click event */
          children || (
            <Button
              iconStartSvg={UploadSvg}
              style={style}
              tone={tone}
              className={css.uploadButton}
              asSpan
              fullWidth
              disabled={disabled}
            >
              {type === DiffInputType.FOLDER
                ? 'Open folder'
                : t('TextDiff.originalTextUploadButtonLabel')}
            </Button>
          )
        }
      </label>
    </div>
  );
};

export default DiffUploadButton;
