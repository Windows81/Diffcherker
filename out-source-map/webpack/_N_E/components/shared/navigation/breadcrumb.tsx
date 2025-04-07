import Link from 'next/link';
import css from './breadcrumb.module.css';
import cx from 'classnames';
import ChevronRightSvg from 'components/shared/icons/chevron-right.svg';
import Icon from '../icon';

interface Breadcrumb {
  className?: string;
  href: string;
}

const Breadcrumb: React.FC<React.PropsWithChildren<Breadcrumb>> = ({
  className,
  href,
  children,
}) => {
  return (
    <div className={cx(css.breadcrumb, className)}>
      <Link href={href}>{children}</Link>
      <Icon size="xs" svg={ChevronRightSvg} />
    </div>
  );
};

export default Breadcrumb;
