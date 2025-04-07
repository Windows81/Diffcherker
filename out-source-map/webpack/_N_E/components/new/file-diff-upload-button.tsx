import { FC } from 'react';
import DiffUploadButton, {
  DiffUploadButtonProps,
} from './diff-upload/diff-upload-button';
import Button from 'components/shared/button';
import css from './file-diff-upload-button.module.css';

export type FileUploadButtonProps = Omit<
  DiffUploadButtonProps,
  'label' | 'style' | 'tone'
> & {
  filename: string;
  svg?: React.FC<React.SVGProps<SVGSVGElement>>;
};

const FileDiffUploadButton: FC<FileUploadButtonProps> = (props) => {
  const { filename, svg, ...rest } = props;

  return (
    <div className={css.fileDiffUploadContainer}>
      <DiffUploadButton label={filename} {...rest}>
        <Button
          className={css.button}
          iconStartSvg={svg}
          style="text"
          tone="base"
          title={filename}
          asSpan
          disabled={rest.disabled}
        >
          {filename}
        </Button>
      </DiffUploadButton>
    </div>
  );
};

export default FileDiffUploadButton;
