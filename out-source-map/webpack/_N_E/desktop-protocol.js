const protocol = 'diffchecker';

const licenseLoginPath = 'license-key-login';

const getLicenseLoginUrl = (license) =>
  `${protocol}://${licenseLoginPath}?license=${encodeURIComponent(
    JSON.stringify(license),
  )}&key=${license.key}`;

const isLicenseLoginUrl = (url) => {
  try {
    const { host, searchParams } = new URL(url);
    const hasLicense = searchParams.has('license');
    return host === licenseLoginPath && hasLicense;
  } catch (error) {
    if (error instanceof TypeError) {
      return false;
    }
    throw error;
  }
};

const getLicenseDataFromUrl = (url) => {
  const params = new URL(url).searchParams;
  const license = JSON.parse(params.get('license'));
  return license;
};

module.exports = {
  getLicenseLoginUrl,
  isLicenseLoginUrl,
  protocol,
  getLicenseDataFromUrl,
};
