import * as React from 'react';
import Page from 'components/page';
import titleTemplate from 'lib/title-template';
import Tracking from 'lib/tracking';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import {
  DesktopPlatform,
  WindowsSetup,
  getDownloadLink,
} from 'types/desktop-versions';

interface StartDownloadProps {
  platform: DesktopPlatform;
}

const StartDownload = (props: StartDownloadProps): JSX.Element => {
  const [link, setLink] = useState('');
  const platform =
    props.platform.charAt(0).toUpperCase() + props.platform.slice(1);
  const trackDownload = (platform: string) =>
    Tracking.trackEvent('Downloaded desktop app', { platform });

  useEffect(() => {
    getDownloadLink(props.platform, WindowsSetup.FULL).then((link) => {
      trackDownload(props.platform);
      setLink(link);
      location.href = link;
    });
  }, [props.platform]);

  return (
    <Page name="Download Desktop">
      <Head>
        <title>{titleTemplate(`Download Diffchecker for ${platform}`)}</title>
      </Head>
      <div>Your download is starting...</div>
      <div style={{ marginTop: 10 }}>
        If it doesn&apos;t start automatically, please click{' '}
        <a
          onClick={() => trackDownload(props.platform)}
          href={link}
          target="_blank"
          rel="noreferrer"
        >
          here
        </a>
      </div>
    </Page>
  );
};

export default StartDownload;
