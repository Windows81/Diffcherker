import * as React from 'react';
import StartDownload from 'components/start-download';
import { DesktopPlatform } from 'types/desktop-versions';

const DownloadLinux = (): JSX.Element => (
  <StartDownload platform={DesktopPlatform.LINUX} />
);

export default DownloadLinux;
