import Button from 'components/button';
import Page from 'components/page';
import { colors, text } from 'css/variables';
import { intlFormat } from 'date-fns';
import { useAutoUpdates } from 'lib/state/autoUpdate';
import { useDarkMode } from 'lib/state/darkMode';
import ErrorPage from 'next/error';
import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import * as AppActions from 'redux/modules/app-module';
import { State, useAppDispatch } from 'redux/store';
import ElectronTitle from 'types/electron-page-titles';
import yn from 'yn';
import ipcEvents from '../ipc-events';
import {
  useLicensePlanTier,
  useLicenseValue,
  useLogoutDesktop,
} from 'lib/state/license';

const PreferencesDesktop = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const allowUsageDataCollection = useSelector(
    (state: State) => state.app.allowUsageDataCollection,
  );
  const [darkMode, setDarkMode] = useDarkMode();
  const [autoUpdates, setAutoUpdates] = useAutoUpdates();
  const planTier = useLicensePlanTier();
  const license = useLicenseValue();
  const [appVersion, setAppVersion] = useState<string>('');
  const logoutDesktop = useLogoutDesktop();

  const isEnterprise = planTier === 'enterprise';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      dispatch(AppActions.actions.initializeAppStore());
      setAppVersion(window.appVersion);
    }
  }, [dispatch]);
  const handleExtendClick = (ev: React.MouseEvent<HTMLButtonElement>) => {
    ev.preventDefault();
    const url = license.isTrial
      ? `https://www.diffchecker.com/buy-desktop?purchaseCode=${license?.purchaseCode}&utm_source=diffchecker&utm_medium=diffchecker-desktop&utm_campaign=preferences-upgrade`
      : 'https://www.diffchecker.com/account?utm_source=diffchecker&utm_medium=diffchecker-desktop&utm_campaign=preferences-renew';
    window.ipcRenderer.send(ipcEvents.APP__OPEN_EXTERNAL_REQUESTED, url);
  };
  const validUntil = license.expiresAt
    ? intlFormat(new Date(license.expiresAt), {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'unknown';
  return (
    <Page name="Preferences" hasHeader={false}>
      <Head>
        <title>{ElectronTitle.Preferences}</title>
      </Head>
      <div className="preferences-page">
        <div className="preferences-page-content">
          <div className="item">
            <h2 className="smallHeading">App version</h2>
            <p className="value">{appVersion}</p>
          </div>
          {!yn(process.env.PERPETUAL_BUILD) && (
            <div className="item">
              <h2 className="smallHeading">License</h2>
              <div className="value">
                {/* TODO: show the status on license, for trial show the number of days remaining */}
                {/* <div className="licenseBadge licenseBadge--active">Active</div> */}
                <h3 className="label">Valid until:</h3>
                <p>{validUntil}</p>
                {!yn(process.env.OFFLINE_BUILD) && (
                  <Button type="brand" onClick={handleExtendClick}>
                    Extend license
                  </Button>
                )}
              </div>
            </div>
          )}
          <div className="item">
            <h2 className="smallHeading">Theme</h2>
            <label className="radio">
              <input
                type="radio"
                checked={darkMode}
                onChange={(event) => {
                  if (event.target.checked) {
                    setDarkMode(true);
                  }
                }}
                id="darkmodeSwitch"
                name="theme"
              />
              Dark theme
            </label>
            <label className="radio">
              <input
                type="radio"
                checked={!darkMode}
                onChange={(event) => {
                  if (event.target.checked) {
                    setDarkMode(false);
                  }
                }}
                id="lightmodeSwitch"
                name="theme"
              />
              Light theme
            </label>
          </div>
          {!yn(process.env.OFFLINE_BUILD) && !isEnterprise && (
            <div className="item">
              <h2 className="smallHeading">Help improve Diffchecker</h2>
              <label>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={allowUsageDataCollection}
                  onChange={() =>
                    dispatch(
                      AppActions.actions.toggleUsageDataCollectionAllowed(),
                    )
                  }
                />
                <div className="checkbox-label">
                  Send anonymized usage data
                  <p className="label-detail">(no diff data included)</p>
                </div>
              </label>
            </div>
          )}
          {!yn(process.env.OFFLINE_BUILD) && (
            <div className="item">
              <h2 className="smallHeading">Updates</h2>
              <label>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={autoUpdates}
                  onChange={() => {
                    setAutoUpdates(!autoUpdates);
                  }}
                />
                <div className="checkbox-label">
                  Allow automatic updates
                  <p className="label-detail">(recommended)</p>
                </div>
              </label>
            </div>
          )}
        </div>
        {!yn(process.env.PERPETUAL_BUILD) && (
          <div className="logout-container">
            <Button
              type="white"
              onClick={() => {
                logoutDesktop();
              }}
              style={{
                minWidth: 300,
              }}
            >
              Logout
            </Button>
          </div>
        )}
      </div>
      <style jsx>{`
        .preferences-page {
          display: flex;
          height: 100vh;
          width: 100%;
          background: var(--back-strongest);
          justify-content: space-between;
          flex-direction: column;
        }
        .preferences-page-content {
          max-width: 600px;
          margin: 20px auto;
          display: flex; /* this display: flex needs to exist to fix an IE11 flexbox bug with min-height */
          flex-direction: column;
          padding-top: 1rem;
        }
        .mainHeading {
          font-size: ${text.title.medium.size};
          font-weight: ${text.title.weight};
          margin-bottom: 1rem;
        }
        .smallHeading {
          font-size: ${text.title.default.size};
          font-weight: ${text.title.weight};
          margin-right: 0.5em;
        }
        .label {
          margin-top: 1rem;
          font-size: ${text.label.default.size};
          font-weight: ${text.label.bold.weight};
        }
        .label-detail {
          font-size: ${text.label.small.size};
          color: var(--front-strong);
        }
        .item {
          display: flex;
          flex-direction: column;
          font-size: 13px;
          margin-bottom: 20px;
        }
        .radio {
          margin-bottom: 0.5rem;
        }
        .radio input {
          margin-right: 10px;
        }
        .checkbox {
          margin-right: 10px;
        }
        a {
          font-size: 0.9em;
          margin-left: 10px;
        }
        .checkbox-label {
          display: inline-block;
          vertical-align: top;
        }
        .logout-container {
          width: 100%;
          margin: 0 auto;
          background: var(--back-stronger);
          padding: 50px 0;
          text-align: center;
        }
        .licenseBadge {
          padding: 0.5em 1em;
          border-radius: 2rem;
          display: inline-block;
          font-size: ${text.label.default.size};
          font-weight: ${text.label.bold.weight};
        }
        .licenseBadge--active {
          background: var(--brand-light);
          color: ${colors.brand.default};
        }
        .licenseBadge--trial {
          background: var(--orange-light);
          color: ${colors.orange.default};
        }
        .licenseBadge--expired {
          background: var(--red-light);
          color: ${colors.red.default};
        }
        .valid-until {
          margin: 1em 0;
          display: block;
        }
      `}</style>
    </Page>
  );
};

export default !process.env.NEXT_PUBLIC_IS_ELECTRON
  ? () => <ErrorPage title="Page does not exist." statusCode={404} />
  : PreferencesDesktop;
