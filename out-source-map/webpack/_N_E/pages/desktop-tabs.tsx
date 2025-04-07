import React, { useEffect, useRef } from 'react';
import * as AppActions from 'redux/modules/app-module';
import { useAppDispatch } from 'redux/store';
import { colors, text } from 'css/variables';
import { darken } from 'lib/color';
import ErrorPage from 'next/error';
import { useDarkModeValue } from 'lib/state/darkMode';
import dynamic from 'next/dynamic';
import {
  useDisableLicenseModalValue,
  useIsLicenseExpired,
  useIsLicenseValid,
} from 'lib/state/license';

const TabBar = dynamic(
  async () => {
    const { TabBar } = await import('components/electron/tabs/TabBar');
    return TabBar;
  },
  { ssr: false },
);

const TabsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const darkMode = useDarkModeValue();
  const disableLicenseModal = useDisableLicenseModalValue();
  const isExpired = useIsLicenseExpired();
  const isValid = useIsLicenseValid();

  const useComponentWillMount = (cb: () => void) => {
    const willMount = useRef(true);
    if (willMount.current) {
      cb();
    }
    willMount.current = false;
  };

  useComponentWillMount(() => {
    if (typeof window !== 'undefined') {
      dispatch(AppActions.actions.initializeAppStore());
    }
  });

  useEffect(() => {
    document.documentElement.classList.add('new');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (isExpired && isValid && !disableLicenseModal) {
      document.documentElement.classList.add('expired');
    } else {
      document.documentElement.classList.remove('expired');
    }

    return () => {
      document.documentElement.classList.remove('new');
    };
  }, [darkMode, disableLicenseModal, isValid, isExpired]);

  return (
    <div>
      <TabBar />
      <style jsx global>{`
        :root {
          ${darkMode
            ? `
            --back-strongest: ${colors.grey.darkest};
            --back-stronger: ${darken(colors.grey.darker, 30)};
            --back-strong: ${colors.grey.darker};
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
            --brand-medium: ${colors.brand.dark};
            --red-light: ${colors.red.darkest};
            --orange-light: ${colors.orange.darkest};
            --purple-light: ${colors.purple.darkest};

            --images-brightness: 80%;
            `
            : `
            --back-strongest: ${colors.white};
            --back-stronger: ${colors.grey.lighter};
            --back-strong: ${colors.grey.light};
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
            --orange-light: ${colors.orange.light};
            --purple-light: ${colors.purple.light};

            --images-brightness: 100%;
            `}
        }

        html {
          font-size: 16px;
        }
        body {
          background: var(--back-strongest);
          color: var(--front-stronger);
          font-family: ${text.family.sansSerif} !important;
          line-height: 1.3;
        }
        a {
          color: ${colors.brand.default};
        }
        .loader-layout {
          width: 100%;
          height: 100vh;
          display: flex;
        }
        .loader {
          margin: auto;
        }
      `}</style>
    </div>
  );
};

export default !process.env.NEXT_PUBLIC_IS_ELECTRON
  ? () => <ErrorPage title="Page does not exist." statusCode={404} />
  : TabsPage;
