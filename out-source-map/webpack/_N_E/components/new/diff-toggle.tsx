import cx from 'classnames';
import ToggleSwitch from 'components/shared/toggle-switch';

import css from './diff-toggle.module.css';
import Icon from 'components/shared/icon';

interface DiffToggleProps<T> {
  label: string;
  currentValue: T;
  onValue: T;
  offValue: T;
  disabled?: boolean;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  iconClassName?: string;
  onClick?: (newValue: T) => void;
  handleChange?: (newValue: T) => void;
  checkIfAllowed?: () => boolean;
}

const DiffToggle = <T,>({
  label,
  currentValue,
  onValue,
  offValue,
  disabled,
  icon,
  iconClassName,
  onClick,
  handleChange,
  checkIfAllowed,
}: DiffToggleProps<T>): React.ReactElement<T> => {
  const clickToggle = async () => {
    if (disabled) {
      return;
    }

    const newValue = currentValue === onValue ? offValue : onValue;
    onClick?.(newValue);
    // switching off is always allowed and shoudn't increase the limit count
    if (newValue === offValue || checkIfAllowed?.()) {
      handleChange?.(newValue);
    }
  };

  return (
    <div className={css.container}>
      {icon !== undefined && (
        <Icon className={cx(css.icon, iconClassName)} svg={icon} size="small" />
      )}
      <span className={cx(css.label, { [css.disabled]: disabled })}>
        {label}
      </span>
      <ToggleSwitch
        isOn={currentValue === onValue}
        onClick={clickToggle}
        disabled={disabled}
        className={css.toggle}
        name={label}
      />
    </div>
  );
};

export default DiffToggle;
