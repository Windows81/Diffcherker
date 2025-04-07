import css from './toggle-switch.module.css';
import stringReplaceAll from 'string-replace-all';
import cx from 'classnames';

interface ToggleSwitchProps {
  isOn?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  isOn,
  onClick,
  disabled,
  className,
  id,
  name,
}) => {
  return (
    <input
      type="checkbox"
      id={id}
      name={name}
      className={cx(className, css.toggleButton)}
      onClick={() => onClick?.()}
      disabled={disabled}
      checked={isOn}
      data-testid={`toggle-switch-${stringReplaceAll(name || '', ' ', '-').toLowerCase()}`}
      readOnly
    />
  );
};

export default ToggleSwitch;
