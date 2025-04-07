import * as React from 'react';
import StartDownload from 'components/start-download';
import { DesktopPlatform } from 'types/desktop-versions';

const DownloadWindows = (): JSX.Element => (
  <StartDownload platform={DesktopPlatform.WINDOWS} />
);

export default DownloadWindows;
