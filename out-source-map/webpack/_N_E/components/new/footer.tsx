import cx from 'classnames';
import { t } from 'lib/react-tiny-i18n';
import Link from 'next/link';
import { useRouter } from 'next/router';

import Divider from '../shared/divider';
import css from './footer.module.css';

const languages = [
  {
    name: 'English',
    url: 'en',
  },
  {
    name: 'Français',
    url: 'fr',
  },
  {
    name: 'Español',
    url: 'es',
  },
  {
    name: 'Português',
    url: 'pt',
  },
  {
    name: 'Italiano',
    url: 'it',
  },
  {
    name: 'Deutsch',
    url: 'de',
  },
  {
    name: 'हिन्दी',
    url: 'hi',
  },
  {
    name: '简体',
    url: 'zh-Hans',
  },
  {
    name: '繁體',
    url: 'zh-Hant',
  },
  {
    name: '日本語',
    url: 'jp',
  },
];

type FooterProps = {
  hideDivider?: boolean;
  miniFooter?: boolean;
};

const Footer: React.FC<FooterProps> = ({
  hideDivider = false,
  miniFooter = false,
}) => {
  const router = useRouter();

  return (
    <footer
      className={cx('hide-print', css.footer, { [css.miniFooter]: miniFooter })}
    >
      {!hideDivider && <Divider className={css.divider} />}
      <div className={css.content}>
        <ul className={css.links}>
          <li className={css.copyright}>&copy; 2024 Checker Software Inc.</li>
          <li>
            <Link href="/contact" prefetch={false}>
              {t('Footer.contact')}
            </Link>
          </li>
          <li>
            <Link href="/cli" prefetch={false}>
              {t('Footer.cli')}
            </Link>
          </li>
          <li>
            <Link href="/terms" prefetch={false}>
              {t('Footer.terms')}
            </Link>
          </li>
          <li>
            <Link href="/privacy-policy" prefetch={false}>
              {t('Footer.privacyPolicy')}
            </Link>
          </li>
          <li>
            <Link href="/public-api" prefetch={false}>
              {t('Footer.api')}
            </Link>
          </li>
          <li>
            <a
              href="https://www.comparetext.net/"
              target="_blank"
              rel="noreferrer"
            >
              Compare Text
            </a>
          </li>
        </ul>
        <ul className={css.languages}>
          {languages.map((language) => (
            <li key={language.url}>
              <a
                href={`${language.url === 'en' ? '' : '/' + language.url}${
                  router.asPath
                }`}
              >
                {language.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
