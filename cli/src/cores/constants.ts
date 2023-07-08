// Check asset-upload.config.spec.ts for complete list
// TODO: we should get this list from the server via API in the future

// Videos
const videos = ['mp4', 'webm', 'mov', '3gp', 'avi', 'm2ts', 'mts', 'mpg', 'flv', 'mkv', 'wmv'];

// Images
const heic = ['heic', 'heif'];
const jpeg = ['jpg', 'jpeg'];
const png = ['png'];
const gif = ['gif'];
const tiff = ['tif', 'tiff'];
const webp = ['webp'];
const dng = ['dng'];
const other = [
  '3fr',
  'ari',
  'arw',
  'avif',
  'cap',
  'cin',
  'cr2',
  'cr3',
  'crw',
  'dcr',
  'nef',
  'erf',
  'fff',
  'iiq',
  'jxl',
  'k25',
  'kdc',
  'mrw',
  'orf',
  'ori',
  'pef',
  'raf',
  'raw',
  'rwl',
  'sr2',
  'srf',
  'srw',
  'orf',
  'ori',
  'x3f',
];

export const ACCEPTED_FILE_EXTENSIONS = [
  ...videos,
  ...jpeg,
  ...png,
  ...heic,
  ...gif,
  ...tiff,
  ...webp,
  ...dng,
  ...other,
];
