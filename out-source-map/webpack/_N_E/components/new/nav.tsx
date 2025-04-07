import cx from 'classnames';
import Divider from 'components/shared/divider';
import createApiUrl from 'lib/create-api-url';
import generateUrl from 'lib/generate-url';
import { t } from 'lib/react-tiny-i18n';
import Tracking from 'lib/tracking';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  getUserPlanTier,
  isLoggedIn as isLoggedInUser,
} from 'redux/selectors/user-selector';
import { useAppSelector } from 'redux/store';
import TrialBar from './trial-bar';

import Button from '../shared/button';
import FolderModal from './folder-modal';
import NavUserDropdown from './nav-user-dropdown';
import css from './nav.module.css';
import ChevronDownSvg from 'components/shared/icons/chevron-down.svg';
import ChevronUpSvg from 'components/shared/icons/chevron-up.svg';
import Logo from './logo';

interface NavPage {
  id: string;
  label: string;
  href: string;
  className: string;
  isActivePage: (pathname: string) => boolean;
}

const getPages = (t: (str: string) => string): NavPage[] => [
  {
    id: 'text',
    label: t('Nav.text'),
    href: '/',
    className: css.text,
    isActivePage: (pathname: string) =>
      pathname === '/' ||
      pathname === '/text-compare' ||
      pathname === '/[slug]',
  },
  {
    id: 'images',
    label: t('Nav.images'),
    href: '/image-compare',
    className: css.image,
    isActivePage: (pathname: string) => pathname === '/image-compare',
  },
  {
    id: 'pdf',
    label: t('Nav.document'),
    href: '/word-pdf-compare',
    className: css.pdf,
    isActivePage: (pathname: string) => pathname === '/word-pdf-compare',
  },
  {
    id: 'excel',
    label: t('Nav.excel'),
    href: '/excel-compare',
    className: css.excel,
    isActivePage: (pathname: string) => pathname === '/excel-compare',
  },
];

const Nav: React.FC = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pages = getPages(t);

  const { pathname, query } = router;
  const currentPage = pages.find(({ isActivePage }) =>
    isActivePage?.(pathname),
  );
  const activePage = currentPage || pages[0];

  const signupUrl = generateUrl('/signup', query);
  const loginUrl = generateUrl('/login', query);

  const mobileMainItemButtonProps = currentPage
    ? {
        onClick: () => {
          setIsOpen(!isOpen);
        },
      }
    : {
        nextLink: true,
        prefetch: false,
        href: activePage.href,
      };

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleNavClickReset = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.reload();
  };

  return (
    <nav className={css.nav}>
      <Logo />
      <div
        className={cx('hide-print', css.mainLinks, {
          [css.open]: isOpen,
        })}
      >
        <ul className={cx(css.buttonGrouping, css.diffLinks)}>
          <li
            className={cx(css.mobileMainItem, {
              [css.active]: activePage.isActivePage(pathname),
            })}
          >
            <Button
              {...mobileMainItemButtonProps}
              style="basic"
              className={cx(css.navItem, activePage.className)}
              iconEndSvg={isOpen ? ChevronUpSvg : ChevronDownSvg}
            >
              {activePage.label}
            </Button>
          </li>
          {pages.map(({ id, label, href, className, isActivePage }) => {
            const isActive = isActivePage(pathname);
            return (
              <li
                key={id}
                className={cx({
                  [css.active]: isActive,
                  [css.hideOnMobile]: id === activePage.id,
                })}
              >
                <Button
                  nextLink
                  href={href}
                  prefetch={false}
                  style="basic"
                  className={cx(css.navItem, className)}
                  onClick={isActive ? handleNavClickReset : undefined}
                >
                  {label}
                </Button>
              </li>
            );
          })}
          <li>
            <Button
              style="basic"
              className={cx(css.navItem, css.folder)}
              onClick={() => {
                Tracking.trackEvent('Clicked nav item', { navItem: 'folder' });
                setIsModalOpen(true);
              }}
            >
              {t('Nav.folders')}
            </Button>
            <FolderModal
              isOpen={isModalOpen}
              closeModal={() => setIsModalOpen(false)}
            />
          </li>
        </ul>
        <ul className={cx('hide-print', css.buttonGrouping, css.purchaseLinks)}>
          <li>
            <Button
              nextLink
              href="/pro-features"
              prefetch={false}
              onClick={() => {
                Tracking.trackEvent('Clicked nav item', { navItem: 'pro app' });
              }}
              style="basic"
              className={css.navItem}
            >
              {t('Nav.features')}
            </Button>
          </li>
          <li>
            <Button
              nextLink
              href="/diffchecker-legal"
              prefetch={false}
              onClick={() => {
                Tracking.trackEvent('Clicked nav item', {
                  navItem: 'diffchecker legal',
                });
              }}
              style="basic"
              className={css.navItem}
            >
              Legal
            </Button>
          </li>
          <li>
            <Button
              nextLink
              href="/desktop"
              prefetch={false}
              onClick={() => {
                Tracking.trackEvent('Clicked nav item', {
                  navItem: 'desktop app',
                });
              }}
              style="basic"
              className={css.navItem}
            >
              {t('Nav.desktop')}
            </Button>
          </li>
          <li>
            <Button
              nextLink
              href="/pricing"
              prefetch={false}
              onClick={() => {
                Tracking.trackEvent('Clicked nav item', { navItem: 'pricing' });
              }}
              style="basic"
              className={css.navItem}
            >
              {t('Nav.pricing')}
            </Button>
          </li>
        </ul>
      </div>
      <NavAccount loginUrl={loginUrl} />
      <NavUserDropdown loginUrl={loginUrl} signupUrl={signupUrl} />
    </nav>
  );
};

interface NavAccountProps {
  loginUrl: string;
}

const NavAccount: React.FC<NavAccountProps> = ({ loginUrl }) => {
  const router = useRouter();
  const isLoggedIn = useAppSelector(isLoggedInUser);
  const userPlanTier = useAppSelector(getUserPlanTier);

  const isNotFreeTier = userPlanTier !== 'free';
  const isTrial = userPlanTier === 'trial';

  const { pathname } = router;

  const downloadDesktopButton = (
    <Button
      className={css.hideDownloadDesktop}
      style="primary"
      tone="green"
      href="/download-trial"
      onClick={() => {
        Tracking.trackEvent('Clicked nav item', {
          navItem: 'get desktop button',
        });
      }}
      nextLink
    >
      {t('Header.downloadDesktop')}
    </Button>
  );

  if (!isLoggedIn) {
    return (
      <>
        <div
          className={cx(
            'hide-print',
            css.buttonGrouping,
            css.dividerContainer,
            css.hideOnMobile,
          )}
        >
          <Divider vertical className={css.divider} />
          <div
            id="g_id_onload"
            data-client_id={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
            data-context="signin"
            data-cancel_on_tap_outside="false"
            data-prompt_parent_id="g_id_onload"
            data-login_uri={createApiUrl(
              `/auth/google/one-tap/callback?flow=signup&next=${encodeURIComponent(
                pathname,
              )}`,
            )}
          />
        </div>
        <ul
          className={cx(
            'hide-print',
            css.buttonGrouping,
            css.accountLinks,
            css.hideOnMobile,
          )}
        >
          <li>
            <Button
              nextLink
              href={loginUrl}
              prefetch={false}
              onClick={() => {
                Tracking.trackEvent('Clicked nav item', { navItem: 'sign in' });
              }}
              style="basic"
              className={css.navItem}
            >
              {t('Header.signIn')}
            </Button>
          </li>
          {!isLoggedIn && <li>{downloadDesktopButton}</li>}
        </ul>
      </>
    );
  }

  return <>{isNotFreeTier ? isTrial && <TrialBar /> : downloadDesktopButton}</>;
};

export default Nav;
