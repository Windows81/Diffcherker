export default function getOs():
  | 'mac'
  | 'ios'
  | 'windows'
  | 'android'
  | 'linux'
  | undefined {
  const userAgent = window.navigator.userAgent;
  const platform = window.navigator.platform;
  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
  if (macosPlatforms.includes(platform)) {
    return 'mac';
  } else if (iosPlatforms.includes(platform)) {
    return 'ios';
  } else if (windowsPlatforms.includes(platform)) {
    return 'windows';
  } else if (userAgent.includes('Android')) {
    return 'android';
  } else if (platform.includes('Linux')) {
    return 'linux';
  }
  return undefined;
}
