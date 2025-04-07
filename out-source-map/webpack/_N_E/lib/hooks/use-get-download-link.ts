import { useState, useCallback } from 'react';
import {
  DesktopPlatform,
  WindowsSetup,
  getDownloadLink,
  quickLoadLink,
} from 'types/desktop-versions';

type DownloadLinks = {
  [platform in DesktopPlatform]?: {
    [windowsSetup in WindowsSetup]?: string;
  };
};

const useGetDownloadLink = () => {
  const [links, setLinks] = useState<DownloadLinks>({});

  const loadLink = useCallback(
    async (platform: DesktopPlatform, windowsSetup: WindowsSetup) => {
      const link = await getDownloadLink(platform, windowsSetup);
      setLinks((prevLinks) => ({
        ...prevLinks,
        [platform]: {
          ...(prevLinks[platform] ?? {}),
          [windowsSetup]: link,
        },
      }));
    },
    [],
  );

  const getLink = useCallback(
    (
      platform: DesktopPlatform,
      windowsSetup: WindowsSetup = WindowsSetup.WEB,
    ): string => {
      const link = links[platform]?.[windowsSetup];
      if (!link) {
        loadLink(platform, windowsSetup);
        return quickLoadLink(platform);
      } else {
        return link;
      }
    },
    [links, loadLink],
  );

  return getLink;
};

export default useGetDownloadLink;
