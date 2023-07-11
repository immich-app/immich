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

const profile: Record<string, string> = {
  '.avif': 'image/avif',
  '.dng': 'image/x-adobe-dng',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const image: Record<string, string> = {
  ...profile,
  '.3fr': 'image/x-hasselblad-3fr',
  '.ari': 'image/x-arriflex-ari',
  '.arw': 'image/x-sony-arw',
  '.cap': 'image/x-phaseone-cap',
  '.cin': 'image/x-phantom-cin',
  '.cr2': 'image/x-canon-cr2',
  '.cr3': 'image/x-canon-cr3',
  '.crw': 'image/x-canon-crw',
  '.dcr': 'image/x-kodak-dcr',
  '.erf': 'image/x-epson-erf',
  '.fff': 'image/x-hasselblad-fff',
  '.gif': 'image/gif',
  '.iiq': 'image/x-phaseone-iiq',
  '.k25': 'image/x-kodak-k25',
  '.kdc': 'image/x-kodak-kdc',
  '.mrw': 'image/x-minolta-mrw',
  '.nef': 'image/x-nikon-nef',
  '.orf': 'image/x-olympus-orf',
  '.ori': 'image/x-olympus-ori',
  '.pef': 'image/x-pentax-pef',
  '.raf': 'image/x-fuji-raf',
  '.raw': 'image/x-panasonic-raw',
  '.rwl': 'image/x-leica-rwl',
  '.sr2': 'image/x-sony-sr2',
  '.srf': 'image/x-sony-srf',
  '.srw': 'image/x-samsung-srw',
  '.tiff': 'image/tiff',
  '.x3f': 'image/x-sigma-x3f',
};

const video: Record<string, string> = {
  '.3gp': 'video/3gpp',
  '.avi': 'video/x-msvideo',
  '.flv': 'video/x-flv',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
  '.mp2t': 'video/mp2t',
  '.mp4': 'video/mp4',
  '.mpeg': 'video/mpeg',
  '.webm': 'video/webm',
  '.wmv': 'video/x-ms-wmv',
};

const sidecar: Record<string, string> = {
  '.xmp': 'application/xml',
};

const isType = (filename: string, lookup: Record<string, string>) => !!lookup[extname(filename).toLowerCase()];
const getType = (filename: string, lookup: Record<string, string>) => lookup[extname(filename).toLowerCase()];

export const mimeTypes = {
  image,
  profile,
  sidecar,
  video,

  isAsset: (filename: string) => isType(filename, image) || isType(filename, video),
  isProfile: (filename: string) => isType(filename, profile),
  isSidecar: (filename: string) => isType(filename, sidecar),
  isVideo: (filename: string) => isType(filename, video),
  lookup: (filename: string) => getType(filename, { ...image, ...video, ...sidecar }) || 'application/octet-stream',
};
