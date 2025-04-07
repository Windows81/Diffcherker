import css from './breadcrumbs.module.css';
import cx from 'classnames';

interface Breadcrumbs {
  className?: string;
}

const Breadcrumbs: React.FC<React.PropsWithChildren<Breadcrumbs>> = ({
  className,
  children,
}) => {
  return <div className={cx(css.breadcrumbs, className)}>{children}</div>;
};

export default Breadcrumbs;
