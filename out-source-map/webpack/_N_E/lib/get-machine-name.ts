const platforms: Record<string, string> = {
  darwin: 'macOS',
  linux: 'Linux',
  win32: 'Windows',
  browser: 'Browser',
};

const getMachineName = (): string => {
  let name = '';
  if (window.machine?.username) {
    name += `${window.machine?.username} @ `;
  }
  name += platforms[window.machine?.platform ?? 'browser'];
  return name;
};

export default getMachineName;
