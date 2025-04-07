// Reference: https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
export const BROWSER_SUPPORTED_TYPES = [
  '.apng', // Animated Portable Network Graphics
  '.avif', // AV1 Image File Format
  '.gif', // Graphics Interchange Format
  '.jpg', // Joint Photographic Experts Group image
  '.jpeg', // Joint Photographic Experts Group image
  '.jfif', // Joint Photographic Experts Group image
  '.pjpeg', // Joint Photographic Experts Group image
  '.pjp', // Joint Photographic Experts Group image
  '.png', // Portable Network Graphics
  '.svg', // Scalable Vector Graphics
  '.webp', // Web Picture format
  '.bmp', // Bitmap file
  '.ico', // Microsoft Icon
  '.cur', // Cursor files
];

export const IMAGE_FILE_TYPES = {
  'image/*': [
    ...BROWSER_SUPPORTED_TYPES,
    '.tif',
    '.tiff',
    '.heif',
    '.heic',
    '.psd',
    '.nrw',
    '.xcf',
  ],
  'image/x-*': [
    // Additional raw image extensions - https://stackoverflow.com/questions/43473056/which-mime-type-should-be-used-for-a-raw-image
    '.arw',
    '.cr2',
    '.crw',
    '.dcr',
    '.dng',
    '.erf',
    '.k25',
    '.kdc',
    '.mrw',
    '.nef',
    '.orf',
    '.pef',
    '.raf',
    '.raw',
    '.sr2',
    '.srf',
    '.x3f',
  ],
};
