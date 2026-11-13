import { getFilenameExtension } from '#lib/utils/asset-utils.ts';

const RAW_EXTENSIONS = new Set([
  '3fr',
  'ari',
  'arw',
  'cap',
  'cr2',
  'cr3',
  'crw',
  'dcr',
  'dng',
  'erf',
  'fff',
  'iiq',
  'k25',
  'kdc',
  'mrw',
  'nef',
  'nrw',
  'orf',
  'ori',
  'pef',
  'raf',
  'raw',
  'rw2',
  'rwl',
  'sr2',
  'srf',
  'srw',
  'x3f',
]);

const RAW_MIME_TYPES = new Set([
  'image/3fr',
  'image/ari',
  'image/arw',
  'image/cap',
  'image/cr2',
  'image/cr3',
  'image/crw',
  'image/dcr',
  'image/dng',
  'image/erf',
  'image/fff',
  'image/iiq',
  'image/k25',
  'image/kdc',
  'image/mrw',
  'image/nef',
  'image/nrw',
  'image/orf',
  'image/ori',
  'image/pef',
  'image/raf',
  'image/raw',
  'image/rw2',
  'image/rwl',
  'image/sr2',
  'image/srf',
  'image/srw',
  'image/x3f',
  'image/x-adobe-dng',
  'image/x-arriflex-ari',
  'image/x-canon-cr2',
  'image/x-canon-cr3',
  'image/x-canon-crw',
  'image/x-epson-erf',
  'image/x-fuji-raf',
  'image/x-hasselblad-3fr',
  'image/x-hasselblad-fff',
  'image/x-kodak-dcr',
  'image/x-kodak-k25',
  'image/x-kodak-kdc',
  'image/x-leica-rwl',
  'image/x-minolta-mrw',
  'image/x-nikon-nef',
  'image/x-nikon-nrw',
  'image/x-olympus-orf',
  'image/x-olympus-ori',
  'image/x-panasonic-raw',
  'image/x-panasonic-rw2',
  'image/x-pentax-pef',
  'image/x-phaseone-cap',
  'image/x-phaseone-iiq',
  'image/x-samsung-srw',
  'image/x-sigma-x3f',
  'image/x-sony-arw',
  'image/x-sony-sr2',
  'image/x-sony-srf',
]);

export function isRawAsset(asset: {
  originalFileName?: string | null;
  originalPath?: string | null;
  originalMimeType?: string | null;
}): boolean {
  const extension = getFilenameExtension(asset.originalFileName || asset.originalPath || '');
  if (RAW_EXTENSIONS.has(extension)) {
    return true;
  }

  const mimeType = asset.originalMimeType?.split(';', 1)[0]?.trim().toLowerCase();
  return !!mimeType && RAW_MIME_TYPES.has(mimeType);
}
