import css from './diff-upload-dropzone-button.module.css';
import cx from 'classnames';
import Icon from 'components/shared/icon';

const DiffUploadDropzoneButton = ({
  text,
  svg,
}: {
  text: string;
  svg: React.FC<React.SVGProps<SVGSVGElement>>;
}) => {
  return (
    <div className={cx(css.button, css.fixedWidth)} role="button" tabIndex={0}>
      <div className={css.content}>
        <Icon svg={svg} className={css.icon} />
        <div className={css.text}>{text}</div>
      </div>
    </div>
  );
};

export default DiffUploadDropzoneButton;
