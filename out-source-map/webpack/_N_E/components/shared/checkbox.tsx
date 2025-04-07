import css from './checkbox.module.css';
import cx from 'classnames';

interface CheckboxProps {
  isOn?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
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
      className={cx(className, css.checkBox)}
      onClick={() => onClick?.()}
      disabled={disabled}
      checked={isOn}
      readOnly
    />
  );
};

export default Checkbox;
