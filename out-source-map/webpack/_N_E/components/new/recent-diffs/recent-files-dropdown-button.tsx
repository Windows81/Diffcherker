import ChevronDownSvg from 'components/shared/icons/chevron-down.svg';
import ChevronUpSvg from 'components/shared/icons/chevron-up.svg';
import { DiffInputType } from 'types/diff-input-type';
import css from '../diff-upload/diff-upload-dropzone-button.module.css';
import cx from 'classnames';
import Icon from 'components/shared/icon';

const RecentFilesDropdownButton = ({
  openDropdown,
  setOpenDropdown,
  diffType,
  buttonRef,
  isDropzone,
}: {
  openDropdown: boolean;
  setOpenDropdown: (open: boolean) => void;
  diffType?: DiffInputType;
  buttonRef: React.RefObject<HTMLDivElement>;
  isDropzone?: boolean;
}) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setOpenDropdown(!openDropdown);
    e.stopPropagation();
  };

  return (
    <div
      ref={buttonRef}
      className={cx(
        css.button,
        openDropdown && css.active,
        isDropzone && css.fixedWidth,
      )}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && setOpenDropdown(!openDropdown)}
      role="button"
      tabIndex={0}
    >
      <div className={css.content}>
        <div className={css.text}>
          {diffType === DiffInputType.TEXT ? 'Recent files' : 'Recent'}
        </div>
        <Icon
          svg={openDropdown ? ChevronUpSvg : ChevronDownSvg}
          className={css.icon}
        />
      </div>
    </div>
  );
};

export default RecentFilesDropdownButton;
