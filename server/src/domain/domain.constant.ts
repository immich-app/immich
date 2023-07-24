import { AssetType } from '@app/infra/entities';
import { BadRequestException } from '@nestjs/common';
import { extname } from 'node:path';
import pkg from 'src/../../package.json';

const [major, minor, patch] = pkg.version.split('.');

export interface IServerVersion {
  major: number;
  minor: number;
  patch: number;
}

export const serverVersion: IServerVersion = {
  major: Number(major),
  minor: Number(minor),
  patch: Number(patch),
};

export const SERVER_VERSION = `${serverVersion.major}.${serverVersion.minor}.${serverVersion.patch}`;

export const APP_MEDIA_LOCATION = process.env.IMMICH_MEDIA_LOCATION || './upload';

export const MACHINE_LEARNING_URL = process.env.IMMICH_MACHINE_LEARNING_URL || 'http://immich-machine-learning:3003';
export const MACHINE_LEARNING_ENABLED = MACHINE_LEARNING_URL !== 'false';

export function assertMachineLearningEnabled() {
  if (!MACHINE_LEARNING_ENABLED) {
    throw new BadRequestException('Machine learning is not enabled.');
  }
}

const image: Record<string, string[]> = {
  '.3fr': ['image/3fr', 'image/x-hasselblad-3fr'],
  '.ari': ['image/ari', 'image/x-arriflex-ari'],
  '.arw': ['image/arw', 'image/x-sony-arw'],
  '.avif': ['image/avif'],
  '.cap': ['image/cap', 'image/x-phaseone-cap'],
  '.cin': ['image/cin', 'image/x-phantom-cin'],
  '.cr2': ['image/cr2', 'image/x-canon-cr2'],
  '.cr3': ['image/cr3', 'image/x-canon-cr3'],
  '.crw': ['image/crw', 'image/x-canon-crw'],
  '.dcr': ['image/dcr', 'image/x-kodak-dcr'],
  '.dng': ['image/dng', 'image/x-adobe-dng'],
  '.erf': ['image/erf', 'image/x-epson-erf'],
  '.fff': ['image/fff', 'image/x-hasselblad-fff'],
  '.gif': ['image/gif'],
  '.heic': ['image/heic'],
  '.heif': ['image/heif'],
  '.iiq': ['image/iiq', 'image/x-phaseone-iiq'],
  '.jpeg': ['image/jpeg'],
  '.jpg': ['image/jpeg'],
  '.jxl': ['image/jxl'],
  '.k25': ['image/k25', 'image/x-kodak-k25'],
  '.kdc': ['image/kdc', 'image/x-kodak-kdc'],
  '.mrw': ['image/mrw', 'image/x-minolta-mrw'],
  '.nef': ['image/nef', 'image/x-nikon-nef'],
  '.orf': ['image/orf', 'image/x-olympus-orf'],
  '.ori': ['image/ori', 'image/x-olympus-ori'],
  '.pef': ['image/pef', 'image/x-pentax-pef'],
  '.png': ['image/png'],
  '.raf': ['image/raf', 'image/x-fuji-raf'],
  '.raw': ['image/raw', 'image/x-panasonic-raw'],
  '.rwl': ['image/rwl', 'image/x-leica-rwl'],
  '.sr2': ['image/sr2', 'image/x-sony-sr2'],
  '.srf': ['image/srf', 'image/x-sony-srf'],
  '.srw': ['image/srw', 'image/x-samsung-srw'],
  '.tiff': ['image/tiff'],
  '.webp': ['image/webp'],
  '.x3f': ['image/x3f', 'image/x-sigma-x3f'],
};

const profileExtensions = ['.avif', '.dng', '.heic', '.heif', '.jpeg', '.jpg', '.png', '.webp'];
const profile: Record<string, string[]> = Object.fromEntries(
  Object.entries(image).filter(([key]) => profileExtensions.includes(key)),
);

const video: Record<string, string[]> = {
  '.3gp': ['video/3gpp'],
  '.avi': ['video/avi', 'video/msvideo', 'video/vnd.avi', 'video/x-msvideo'],
  '.flv': ['video/x-flv'],
  '.m2ts': ['video/mp2t'],
  '.mkv': ['video/x-matroska'],
  '.mov': ['video/quicktime'],
  '.mp4': ['video/mp4'],
  '.mpg': ['video/mpeg'],
  '.mts': ['video/mp2t'],
  '.webm': ['video/webm'],
  '.wmv': ['video/x-ms-wmv'],
};

const sidecar: Record<string, string[]> = {
  '.xmp': ['application/xml', 'text/xml'],
};

const isType = (filename: string, r: Record<string, string[]>) => extname(filename).toLowerCase() in r;

const lookup = (filename: string) =>
  ({ ...image, ...video, ...sidecar }[extname(filename).toLowerCase()]?.[0] ?? 'application/octet-stream');

export const mimeTypes = {
  image,
  profile,
  sidecar,
  video,

  isAsset: (filename: string) => isType(filename, image) || isType(filename, video),
  isProfile: (filename: string) => isType(filename, profile),
  isSidecar: (filename: string) => isType(filename, sidecar),
  isVideo: (filename: string) => isType(filename, video),
  lookup,
  assetType: (filename: string) => {
    const contentType = lookup(filename);
    if (contentType.startsWith('image/')) {
      return AssetType.IMAGE;
    } else if (contentType.startsWith('video/')) {
      return AssetType.VIDEO;
    }
    return AssetType.OTHER;
  },
};
