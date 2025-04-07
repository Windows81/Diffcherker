import cx from 'classnames';
import { isProUser } from 'redux/selectors/user-selector';
import { useAppSelector } from 'redux/store';

import css from './diff-checkbox.module.css';
import Checkbox from 'components/shared/checkbox';
import Icon from 'components/shared/icon';

interface DiffCheckboxProps<T> {
  label: string;
  currentValue: T;
  onValue: T;
  offValue: T;
  disabled?: boolean;
  className?: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  iconClassName?: string;
  onClick?: (newValue: T) => void;
  handlePro?: (newValue: T) => void;
  handleNotPro?: (newValue: T) => void;
}

const DiffCheckbox = <T,>({
  label,
  currentValue,
  onValue,
  offValue,
  disabled,
  className,
  icon,
  iconClassName,
  onClick,
  handlePro,
  handleNotPro,
}: DiffCheckboxProps<T>): React.ReactElement<T> => {
  const isPro = useAppSelector(isProUser);

  const handleClick = isPro ? handlePro : handleNotPro;

  const clickToggle = () => {
    if (disabled) {
      return;
    }

    const newValue = currentValue === onValue ? offValue : onValue;
    onClick?.(newValue);
    handleClick?.(newValue);
  };

  return (
    <div
      className={cx(css.container, className)}
      role="checkbox"
      tabIndex={-1}
      aria-checked={currentValue === onValue}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          clickToggle();
          event.stopPropagation();
        }
      }}
      onClick={clickToggle}
    >
      {icon !== undefined && (
        <Icon className={cx(css.icon, iconClassName)} svg={icon} size="small" />
      )}
      <span className={cx(css.label, { [css.disabled]: disabled })}>
        {label}
      </span>
      <Checkbox
        isOn={currentValue === onValue}
        disabled={disabled}
        className={css.checkbox}
      />
    </div>
  );
};

export default DiffCheckbox;
