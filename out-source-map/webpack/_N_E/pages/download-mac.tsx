import * as React from 'react';
import StartDownload from 'components/start-download';
import { DesktopPlatform } from 'types/desktop-versions';

const DownloadMac = (): JSX.Element => (
  <StartDownload platform={DesktopPlatform.MAC} />
);

export default DownloadMac;
