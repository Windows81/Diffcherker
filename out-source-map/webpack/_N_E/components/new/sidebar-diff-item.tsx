import { useState } from 'react';
import { Option } from 'types/option';
import css from './sidebar-diff-item.module.css';
import cx from 'classnames';
import Button from 'components/shared/button';
import Dropdown from 'components/shared/dropdown';
import EllipsisVerticalSvg from 'components/shared/icons/ellipsis-vertical.svg';

interface SidebarDiffItemProps {
  options?: Option<string, { onClick: () => void }>[];
  isSelected?: boolean;
  onClick?: () => void;
  classNames?: {
    base?: string;
    selected?: string;
    open?: string;
    button?: string;
  };
}

const SidebarDiffItem: React.FC<
  React.PropsWithChildren<SidebarDiffItemProps>
> = ({ options = [], isSelected, onClick, classNames, children }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const hasDropdown = options.length > 0;

  return (
    <div
      className={cx(
        css.diffItem,
        classNames?.base,
        isSelected && [css.selected, classNames?.selected],
        isDropdownOpen && [css.open, classNames?.open],
      )}
    >
      <Button
        style="clean"
        onClick={onClick}
        className={cx(css.diffItemButton, classNames?.button, {
          [css.hasDropdown]: hasDropdown,
        })}
      >
        {children}
      </Button>
      {hasDropdown && (
        <div className={css.ellipsisMenuWrapper}>
          <Dropdown
            rightAlign
            isOpen={isDropdownOpen}
            setIsOpen={setIsDropdownOpen}
            display={EllipsisVerticalSvg}
            onChange={() => undefined}
            options={options}
            buttonClassName={cx(css.ellipsisMenuButton, {
              [css.open]: isDropdownOpen,
            })}
          />
        </div>
      )}
    </div>
  );
};

export default SidebarDiffItem;
