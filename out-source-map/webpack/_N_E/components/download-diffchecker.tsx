import Button from 'components/shared/button';
import getOs from 'lib/get-os';
import useGetDownloadLink from 'lib/hooks/use-get-download-link';
import Tracking from 'lib/tracking';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import {
  DesktopPlatform,
  WindowsSetup,
  downloads,
  getDownloadLink,
} from 'types/desktop-versions';
import css from './download-diffchecker.module.css';
import Floating from './floating';
import MessageBanner from './shared/message-banner';

const installationSteps = {
  windows: [
    {
      title: 'Open the file.',
      paragraph: 'Double-click the downloaded installer file to open it.',
    },
    {
      title: 'Follow instructions.',
      paragraph: 'Follow the instructions on the window that opens.',
    },
    {
      title: 'Open Diffchecker.',
      paragraph: 'Use Diffchecker and enjoy!',
    },
  ],
  mac: [
    {
      title: 'Open the file.',
      paragraph: 'Double-click the downloaded .dmg file to open it.',
    },
    {
      title: 'Drag & drop.',
      paragraph:
        'Drag and drop the Diffchecker icon to the Applications folder.',
    },
    {
      title: 'Open Diffchecker.',
      paragraph: 'Double-click the Diffchecker icon in your Apps drawer.',
    },
  ],
  linux: [
    {
      title: 'Go to file properties.',
      paragraph: 'Right-click the file and click Properties.',
    },
    {
      title: 'Change permissions.',
      paragraph:
        'Go to the permissions tab and check "Allow executing file as program".',
    },
    {
      title: 'Open Diffchecker,',
      paragraph: 'Double-click the Diffchecker icon.',
    },
  ],
};

const DownloadDiffchecker = (): JSX.Element => {
  const [os, setOs] = useState<
    'mac' | 'ios' | 'windows' | 'android' | 'linux' | undefined
  >();
  const getLink = useGetDownloadLink();
  const mainDownload = downloads.find((download) => download.platform === os);
  const otherDownloads = downloads.filter(
    (download) => download.platform !== os,
  );
  const trackDownload = ({ platform }: { platform: string }) => {
    Tracking.trackEvent('Downloaded desktop app', { platform });
  };

  useEffect(() => {
    const os = getOs();
    setOs(os);
    const desktopPlatforms: string[] = Object.values(DesktopPlatform);
    if (!os || !desktopPlatforms.includes(os)) {
      return;
    }
    getDownloadLink(os as DesktopPlatform, WindowsSetup.FULL).then((link) => {
      trackDownload({ platform: os });
      location.href = link;
    });
  }, []);

  return (
    <>
      <div className={css.downloadSection}>
        <div className={css.container}>
          {mainDownload ? (
            <div>
              <h2 className={css.titleLarge}>
                Thanks for downloading Diffchecker for{' '}
                <span className={css.platformName}>
                  {mainDownload.platform}
                </span>
                !
              </h2>
              <p className={css.paragraph}>
                <span>Trouble downloading? </span>
                <a
                  onClick={() => {
                    trackDownload({ platform: mainDownload.platform });
                  }}
                  href={getLink(mainDownload.platform, WindowsSetup.FULL)}
                >
                  Try again
                </a>
              </p>
              {os === 'windows' && (
                <>
                  <p className={css.paragraph}>
                    <span>Want a faster download? </span>
                    <a
                      onClick={() => {
                        trackDownload({ platform: mainDownload.platform });
                      }}
                      href={getLink(mainDownload.platform, WindowsSetup.WEB)}
                    >
                      Try the web installer
                    </a>
                  </p>
                  <p className={css.paragraph}>
                    <span>Your organization requires MSI installers? </span>
                    <a
                      onClick={() => {
                        trackDownload({ platform: mainDownload.platform });
                      }}
                      href={getLink(mainDownload.platform)
                        ?.replace(/Web[ +]Setup[ +]/, '')
                        .replace('.exe', '.msi')}
                    >
                      Download the MSI installer
                    </a>
                  </p>
                </>
              )}
              <div className={css.otherLinksSection}>
                <h2 className={css.titleSmall}>Using another platform?</h2>
                <p className={`${css.paragraph} ${css.otherLinks}`}>
                  {otherDownloads.map((download) => (
                    <a
                      key={download.platform}
                      onClick={() => {
                        trackDownload({ platform: download.platform });
                      }}
                      href={getLink(download.platform, WindowsSetup.FULL)}
                    >
                      Download{' '}
                      <span className={css.platformName}>
                        {download.platform}
                      </span>{' '}
                      app
                    </a>
                  ))}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <MessageBanner
                  message={`It is only available for Windows, Mac, or Linux. For all other platforms, you can use Diffchecker Web.`}
                  size="xl"
                  title={`Diffchecker Desktop isn't available on ${os === 'ios' ? 'iOS' : os === 'android' ? 'Android' : 'your device'}`}
                  type="warning"
                  className={css.responsiveText}
                />
              </div>
              <Floating maxWidth="480px">
                <div className={css.otherDownloadLinks}>
                  {otherDownloads.map((download) => (
                    <div className={css.platform} key={download.platform}>
                      <img
                        src={download.image}
                        alt={`Download ${download.platform}`}
                        className={css.platformLogo}
                      />
                      <h3 className={css.titleSmall}>{download.text}</h3>
                      <Button
                        onClick={() => {
                          trackDownload({ platform: download.platform });
                        }}
                        style="primary"
                        tone="green"
                        href={getLink(download.platform, WindowsSetup.FULL)}
                      >
                        Download Now
                      </Button>
                    </div>
                  ))}
                </div>
              </Floating>
            </>
          )}
        </div>
      </div>
      {os !== 'android' && os !== 'ios' && (
        <div className={css.installationSection}>
          <div className={css.container}>
            <h2 className={css.titleMedium}>Installation steps</h2>
            <div className={css.installationSteps}>
              {installationSteps[os || 'windows'].map((step, index) => (
                <div className={css.step} key={step.title}>
                  <h3 className={css.titleSmall}>
                    {index + 1}. {step.title}
                  </h3>
                  <p className={css.paragraph}>{step.paragraph}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className={css.helpSection}>
        <div className={css.container}>
          <p className={css.paragraph}>
            <span>Need more help? </span>
            <Link href="/contact">Contact us</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default DownloadDiffchecker;
