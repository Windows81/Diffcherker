import Button from 'components/shared/button';
import Page from 'components/new/page';
import getOs from 'lib/get-os';
import useGetDownloadLink from 'lib/hooks/use-get-download-link';
import titleTemplate from 'lib/title-template';
import Tracking from 'lib/tracking';
import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import { WindowsSetup, downloads } from 'types/desktop-versions';
import css from './download-desktop.module.css';
import Floating from 'components/floating';

const DownloadDesktop = (): JSX.Element => {
  const [os, setOs] = useState<
    'mac' | 'ios' | 'windows' | 'android' | 'linux' | undefined
  >(undefined);
  const getLink = useGetDownloadLink();

  const trackDownload = ({ platform }: { platform: string }) => {
    Tracking.trackEvent('Downloaded desktop app', { platform });
  };

  useEffect(() => {
    const os = getOs();
    if (os) {
      setOs(os);
    }
  }, []);

  const mainDownload = downloads.find((download) => download.platform === os);
  const otherDownloads = downloads.filter(
    (download) => download.platform !== os,
  );

  return (
    <Page name="Download Diffchecker Desktop" fullWidth>
      <Head>
        <title>{titleTemplate('Download Diffchecker Desktop')}</title>
      </Head>
      <Floating maxWidth={mainDownload ? '360px' : '480px'}>
        <div className={css.container}>
          <h2 className={css.heading}>
            Thank you for purchasing Diffchecker Desktop!
          </h2>
          {mainDownload ? (
            <>
              <Button
                style="primary"
                tone="green"
                size="large"
                onClick={() =>
                  trackDownload({ platform: mainDownload.platform })
                }
                href={getLink(mainDownload.platform, WindowsSetup.FULL)}
              >
                Download Diffchecker Desktop
              </Button>
              <Button
                style="secondary"
                tone="base"
                href="/account"
                size="large"
              >
                Go to Account
              </Button>
            </>
          ) : (
            <div className={css.otherDownloadLinks}>
              {otherDownloads.map((download) => (
                <div key={download.platform} className={css.platform}>
                  <img
                    src={download.image}
                    alt={`Download ${download.platform}`}
                    className={css.platformLogo}
                  />
                  <h3 className={css.platformHeading}>{download.text}</h3>
                  <Button
                    style="primary"
                    tone="green"
                    size="large"
                    onClick={() =>
                      trackDownload({ platform: download.platform })
                    }
                    href={getLink(download.platform, WindowsSetup.FULL)}
                  >
                    Download Now
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Floating>
    </Page>
  );
};

export default DownloadDesktop;
