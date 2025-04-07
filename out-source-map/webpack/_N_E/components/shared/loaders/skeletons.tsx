import cx from 'classnames';
import css from './skeletons.module.css';

interface SkeletonsProps {
  spacing?: 'small' | 'medium' | 'large' | 'xl';
  className?: string;
}

const Skeletons: React.FC<React.PropsWithChildren<SkeletonsProps>> = ({
  spacing = 'medium',
  className,
  children,
}) => {
  return (
    <div className={cx(css.skeletons, className, css[spacing])}>{children}</div>
  );
};

export default Skeletons;
