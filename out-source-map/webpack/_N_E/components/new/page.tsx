import * as AbTestActions from 'redux/modules/ab-test-module';
import * as UserActions from 'redux/modules/user-module';
import cx from 'classnames';
import HrefLangs from 'components/href-langs';
import Tracking from 'lib/tracking';
import Head from 'next/head';
import Router, { useRouter } from 'next/router';
import { useEffect } from 'react';
import {
  getSessionStatus,
  getUserPlanTier,
} from 'redux/selectors/user-selector';
import { useAppDispatch, useAppSelector } from 'redux/store';

import Footer from './footer';
import Nav from './nav';
import css from './page.module.css';
import LicenseExpiredModal from 'components/license-expired-modal';
import LicenseExpiredModalElectron from 'components/electron/license-expired-modal';
import { useDarkModeValue } from 'lib/state/darkMode';
import { pageView } from 'lib/gtag';
import { useIsLicenseExpired } from 'lib/state/license';

if (!process.env.NEXT_PUBLIC_IS_ELECTRON) {
  Router.events.on('routeChangeComplete', (url) => {
    pageView(url);
  });
}

interface PageProps {
  name: string;
  title?: string;
  metaDescription?: string;
  metaKeywords?: string;
  fullWidth?: boolean;
  hasHeader?: boolean;
  miniFooter?: boolean;
  allowAds?: boolean;
}

const Page: React.FC<React.PropsWithChildren<PageProps>> = ({
  name,
  title,
  metaDescription,
  metaKeywords,
  fullWidth = false,
  hasHeader = true,
  miniFooter = false,
  children,
  allowAds = false,
}) => {
  const dispatch = useAppDispatch();
  const darkMode = useDarkModeValue();
  const experiments = useAppSelector((state) => state.abTest.experiments);
  const sessionStatus = useAppSelector((state) => getSessionStatus(state));
  const userId = useAppSelector((state) => state.user.user?.id);
  const userPlanTier = useAppSelector(getUserPlanTier);
  const router = useRouter();
  const isExpired = useIsLicenseExpired();

  useEffect(() => {
    Tracking.setSuperProperties({ userPlanTier });
    Tracking.setUserProperties({ userPlanTier });
  }, [userPlanTier]);

  useEffect(() => {
    const onMount = async () => {
      const runningInBrowser =
        !process.env.NEXT_PUBLIC_IS_ELECTRON && typeof window !== 'undefined';
      if (!runningInBrowser) {
        if (Object.keys(experiments).length === 0) {
          dispatch(AbTestActions.initializeExperimentVariants());
        }
        return;
      }

      try {
        if (userId) {
          Tracking.setUserId(userId);
        } else if (sessionStatus !== 'not present') {
          try {
            const userResponse = await dispatch(
              UserActions.getCurrentUser(),
            ).unwrap();
            Tracking.setUserId(userResponse.id);
          } catch (e) {
            // means user is not logged in
          }
        }
      } finally {
        if (Object.keys(experiments).length === 0) {
          dispatch(AbTestActions.initializeExperimentVariants());
        }
      }
    };

    document.documentElement.classList.add('new');
    void onMount();

    return () => {
      document.documentElement.classList.remove('new');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only run on mount

  useEffect(() => {
    Tracking.trackPage(name);
  }, [name, router.asPath]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div
      id="page"
      className={cx(
        css.main,
        process.env.NEXT_PUBLIC_IS_ELECTRON ? 'electron' : 'web',
        'new',
        darkMode && 'dark',
      )}
    >
      <Head>
        {/* Over-rides defaults set in _app.tsx */}
        {title && <title key="title">{title}</title>}
        {title && <meta key="ogTitle" property="og:title" content={title} />}
        {metaDescription && (
          <meta
            key="description"
            name="description"
            content={metaDescription}
          />
        )}
        {metaDescription && (
          <meta
            key="ogDescription"
            property="og:description"
            content={metaDescription}
          />
        )}
        {metaKeywords && (
          <meta key="keywords" name="keywords" content={metaKeywords} />
        )}
        {process.env.NEXT_PUBLIC_IS_ELECTRON && darkMode && (
          <style
            dangerouslySetInnerHTML={{
              __html: ':root { color-scheme: dark; }',
            }}
          />
        )}
      </Head>
      {allowAds && (
        <>
          {/* this guarantees that we can preemptively set ad commands even if optimize hasn't been inited yet */}
          <script
            id="bsaOptimizeQueue"
            dangerouslySetInnerHTML={{
              __html: `window.optimize = window.optimize || { queue: [] };`,
            }}
          />
          {/* this kicks off ad loading */}
          <script
            id="bsaOptimizeScript"
            src={`https://cdn4.buysellads.net/pub/diffchecker.js?${new Date().getTime() - (new Date().getTime() % 600000)}`}
            async
          />
        </>
      )}
      <HrefLangs path={router.asPath} locales={router.locales} />
      {!process.env.NEXT_PUBLIC_IS_ELECTRON && hasHeader && <Nav />}
      <div
        className={cx(css, css.content, {
          [css.noHeader]: process.env.NEXT_PUBLIC_IS_ELECTRON || !hasHeader,
          [css.noFooter]: process.env.NEXT_PUBLIC_IS_ELECTRON,
          [css.contained]: !fullWidth,
        })}
      >
        {!process.env.NEXT_PUBLIC_IS_ELECTRON && <LicenseExpiredModal />}
        {process.env.NEXT_PUBLIC_IS_ELECTRON && isExpired && (
          <LicenseExpiredModalElectron />
        )}
        {children}
      </div>
      {!process.env.NEXT_PUBLIC_IS_ELECTRON && (
        <Footer hideDivider miniFooter={miniFooter} />
      )}
    </div>
  );
};

export default Page;
