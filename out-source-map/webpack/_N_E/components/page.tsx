import * as React from 'react';
import * as AbTestActions from 'redux/modules/ab-test-module';
import * as UserActions from 'redux/modules/user-module';
import cx from 'classnames';
import HrefLangs from 'components/href-langs';
import { colors, diff } from 'css/variables';
import { darken, lighten } from 'lib/color';
import Tracking from 'lib/tracking';
import Head from 'next/head';
import { Router, useRouter } from 'next/router';
import {
  getSessionStatus,
  getUserPlanTier,
} from 'redux/selectors/user-selector';
import { useAppDispatch, useAppSelector } from 'redux/store';

import LicenseExpiredModal from './license-expired-modal';
import Footer from './new/footer';
import Nav from './new/nav';
import css from './page.module.css';
import { useDarkModeValue } from 'lib/state/darkMode';
import { pageView } from 'lib/gtag';

if (!process.env.NEXT_PUBLIC_IS_ELECTRON) {
  Router.events.on('routeChangeComplete', (url) => {
    pageView(url);
  });
}

interface LayoutProps {
  name: string;
  fullWidth?: boolean;
  footerBackground?: string;
  background?: string;
  hasHeader?: boolean;
}

const Page: React.FC<React.PropsWithChildren<LayoutProps>> = (props) => {
  const dispatch = useAppDispatch();
  const experiments = useAppSelector((state) => state.abTest.experiments);
  const darkMode = useDarkModeValue();
  const sessionStatus = useAppSelector((state) => getSessionStatus(state));
  const userId = useAppSelector((state) => state.user.user?.id);
  const router = useRouter();
  const hasHeader =
    typeof props.hasHeader === 'undefined' ? true : props.hasHeader;

  const userPlanTier = useAppSelector(getUserPlanTier);

  React.useEffect(() => {
    Tracking.setSuperProperties({ userPlanTier });
    Tracking.setUserProperties({ userPlanTier });
  }, [userPlanTier]);

  React.useEffect(() => {
    const onMount = async () => {
      const runningInBrowser =
        !process.env.NEXT_PUBLIC_IS_ELECTRON && typeof window !== 'undefined';
      if (!runningInBrowser) {
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

    document.documentElement.classList.add('old');
    void onMount();

    return () => {
      document.documentElement.classList.remove('old');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only run on mount

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  React.useEffect(() => {
    Tracking.trackPage(props.name);
  }, [props.name, router.asPath]);

  return (
    <div
      id="page"
      className={cx(
        css.main,
        process.env.NEXT_PUBLIC_IS_ELECTRON ? 'electron' : 'web',
        darkMode ? css.dark : css.light,
        'old',
      )}
    >
      <Head>
        {process.env.NEXT_PUBLIC_IS_ELECTRON && darkMode && (
          <style
            dangerouslySetInnerHTML={{
              __html: ':root { color-scheme: dark; }',
            }}
          />
        )}
      </Head>
      <HrefLangs path={router.pathname} locales={router.locales} />

      <div className={css.contentContainer}>
        {hasHeader &&
          (process.env.NEXT_PUBLIC_IS_ELECTRON ? null : (
            <div className="new-nav">
              <Nav />
            </div>
          ))}
        {!process.env.NEXT_PUBLIC_IS_ELECTRON && <LicenseExpiredModal />}
        <div className={cx(css.app, !props.fullWidth && css.content)}>
          {props.children}
        </div>

        {!process.env.NEXT_PUBLIC_IS_ELECTRON && (
          <div className="new-footer">
            <Footer />
          </div>
        )}
      </div>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx global>{`
        :root {
          ${darkMode
            ? `
            --back-strongest: ${colors.grey.darkest};
            --back-stronger: ${darken(colors.grey.darker, 30)};
            --back-strong: ${colors.grey.darker};
            --back-strong-hover: ${lighten(colors.grey.darker, 20)};
            --back-strong-active: ${lighten(colors.grey.darker, 40)};
            --hover-strong: ${colors.grey.darker};
            --back-medium: ${colors.grey.darker};
            --back-medium-inversed: ${colors.black};
            --front-default: ${colors.grey.default};
            --border-default: ${colors.grey.darker};
            --front-default-inversed: ${colors.grey.darker};
            --front-medium: ${colors.grey.faded};
            --front-strong: ${colors.grey.light};
            --front-strong-inversed: ${colors.grey.faded};
            --front-stronger: ${colors.grey.lighter};
            --front-strongest: ${colors.white};

            --brand-light: ${colors.brand.darkest};
            --brand-medium: ${colors.brand.darker};
            --red-light: ${colors.red.darkest};
            --blue-light: ${colors.blue.darkest};
            --orange-light: ${colors.orange.darkest};
            --purple-light: ${colors.purple.darkest};

            --images-brightness: 80%;

            --diff-move-default: ${diff.darkMode.move.default};
            --diff-insert-default: ${darken(diff.darkMode.insert.default, 1)};
            --diff-insert-hover: ${lighten(diff.darkMode.insert.default, 30)};
            --diff-insert-active: ${lighten(diff.darkMode.insert.default, 15)};
            --diff-remove-default: ${darken(diff.darkMode.remove.default, 2.5)};
            --diff-remove-hover: ${lighten(diff.darkMode.remove.default, 20)};
            --diff-remove-active: ${lighten(diff.darkMode.remove.default, 5)};
            --diff-insert-highlight: ${diff.darkMode.insert.highlight};
            --diff-insert-highlight-selected: ${lighten(
              diff.darkMode.insert.highlight,
              25,
            )};
            --diff-remove-highlight: ${diff.darkMode.remove.highlight};
            --diff-remove-highlight-selected: ${lighten(
              diff.darkMode.remove.highlight,
              20,
            )};
            `
            : `
            --back-strongest: ${colors.white};
            --back-stronger: ${colors.grey.lighter};
            --back-strong: ${colors.grey.light};
            --back-strong-hover: ${darken(colors.grey.lighter, 7)};
            --back-strong-active: ${darken(colors.grey.lighter, 14)};
            --hover-strong: ${colors.grey.light};
            --back-medium: ${colors.grey.faded};
            --back-medium-inversed: ${colors.grey.faded};
            --front-default: ${colors.grey.default};
            --border-default: ${colors.grey.default};
            --front-default-inversed: ${colors.grey.default};
            --front-medium: ${colors.grey.medium};
            --front-strong: ${colors.grey.dark};
            --front-strong-inversed: ${colors.grey.dark};
            --front-stronger: ${colors.grey.darker};
            --front-strongest: ${colors.grey.darkest};
            
            --brand-light: ${colors.brand.lightest};
            --brand-medium: ${colors.brand.light};
            --red-light: ${colors.red.light};
            --blue-light: ${colors.blue.light};
            --orange-light: ${colors.orange.light};
            --purple-light: ${colors.purple.light};

            --images-brightness: 100%;
            --diff-move-default: ${diff.move.default};
            --diff-insert-default: ${diff.insert.default};
            --diff-insert-hover: ${darken(diff.insert.default, 9)};
            --diff-insert-active: ${darken(diff.insert.default, 18)};
            --diff-remove-default: ${diff.remove.default};
            --diff-remove-hover: ${darken(diff.remove.default, 5)};
            --diff-remove-active: ${darken(diff.remove.default, 10)};
            --diff-insert-highlight: ${diff.insert.highlight};
            --diff-insert-highlight-selected: ${darken(
              diff.insert.highlight,
              30,
            )};
            --diff-remove-highlight: ${diff.remove.highlight};
            --diff-remove-highlight-selected: ${darken(
              diff.remove.highlight,
              15,
            )};
            `}
        }
      `}</style>
    </div>
  );
};

export default Page;
