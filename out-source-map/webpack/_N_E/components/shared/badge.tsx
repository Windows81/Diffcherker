import css from './badge.module.css';
import cx from 'classnames';

interface BadgeProps {
  style: 'primary' | 'secondary';
  tone: 'base' | 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'blue';
}

const Badge: React.FC<React.PropsWithChildren<BadgeProps>> = ({
  style,
  tone,
  children,
}) => {
  return <div className={cx(css.badge, css[style], css[tone])}>{children}</div>;
};

export default Badge;
