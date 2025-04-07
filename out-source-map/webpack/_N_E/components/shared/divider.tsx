import css from './divider.module.css';
import cx from 'classnames';

interface DividerProps {
  vertical?: boolean;
  className?: string;
  label?: string;
}

const Divider: React.FC<DividerProps> = ({ vertical, className, label }) => {
  return (
    <div
      className={cx(
        vertical ? css.vertical : css.horizontal,
        className,
        label && css.hasLabel,
      )}
    >
      {label}
    </div>
  );
};

export default Divider;
