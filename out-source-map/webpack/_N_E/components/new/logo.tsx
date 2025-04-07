import Link from 'next/link';
import css from './logo.module.css';

const Logo: React.FC = () => (
  <Link className={css.logo} href="/">
    <img
      src="/static/images/new/diffchecker.svg"
      alt="Diffchecker logo"
      className={css.logoImage}
    />
    <span className={css.logoText}>
      <span>Diff</span>checker
    </span>
  </Link>
);

export default Logo;
