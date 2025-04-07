const VERSION = '6.3.0';
const BASE_URL = 'https://dl.diffchecker.com';
const DEFAULT_MAC_BUILD = `Diffchecker-${VERSION}-universal.dmg`;

export type Download = {
  platform: DesktopPlatform;
  text: string;
  image: string;
};

export enum WindowsSetup {
  WEB = 'web',
  FULL = 'full',
}

export enum DesktopPlatform {
  WINDOWS = 'windows',
  MAC = 'mac',
  LINUX = 'linux',
}

const getWindowsLink = (windowsSetup: WindowsSetup = WindowsSetup.WEB) => {
  const webInstallerString = windowsSetup === WindowsSetup.FULL ? '' : `Web `;
  return `${BASE_URL}/Diffchecker ${webInstallerString}Setup ${VERSION}.exe`;
};

const getMacLink = async () => {
  return `${BASE_URL}/${await getMacBuild()}`;
};

const getLinuxLink = () => {
  return `${BASE_URL}/Diffchecker-${VERSION}.AppImage`;
};

const getMacBuild = async (): Promise<string> => {
  if (typeof window === 'undefined') {
    return DEFAULT_MAC_BUILD;
  }
  const values = await navigator.userAgentData?.getHighEntropyValues([
    'architecture',
  ]);
  switch (values?.architecture) {
    case 'arm':
      return `Diffchecker-${VERSION}-arm64.dmg`;
    case 'x86':
      return `Diffchecker-${VERSION}.dmg`;
    default:
      return DEFAULT_MAC_BUILD;
  }
};

export const quickLoadLink = (platform: DesktopPlatform): string => {
  switch (platform) {
    case DesktopPlatform.WINDOWS:
      return getWindowsLink();
    case DesktopPlatform.MAC:
      return `${BASE_URL}/${DEFAULT_MAC_BUILD}`;
    case DesktopPlatform.LINUX:
      return getLinuxLink();
    default:
      throw new Error(`Invalid platform: ${platform}`);
  }
};

export const getDownloadLink = async (
  platform: DesktopPlatform,
  windowsSetup?: WindowsSetup,
): Promise<string> => {
  switch (platform) {
    case DesktopPlatform.WINDOWS:
      return getWindowsLink(windowsSetup);
    case DesktopPlatform.MAC:
      return getMacLink();
    case DesktopPlatform.LINUX:
      return getLinuxLink();
    default:
      throw new Error(`Invalid platform: ${platform}`);
  }
};

export const downloads: Download[] = [
  {
    platform: DesktopPlatform.WINDOWS,
    text: 'Windows 10/11',
    image: '/static/images/windows.svg',
  },
  {
    platform: DesktopPlatform.MAC,
    text: 'macOS/OS X',
    image: '/static/images/osx.svg',
  },
  {
    platform: DesktopPlatform.LINUX,
    text: 'Linux AppImage',
    image: '/static/images/ubuntu.svg',
  },
];
