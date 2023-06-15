import { BadRequestException } from '@nestjs/common';
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

export const supportedFileTypes: string[] = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "avi",
  "mov",
  "mp4",
  "webm",
  "x-msvideo",
  "quicktime",
  "heic",
  "heif",
  "dng",
  "x-adobe-dng",
  "webp",
  "tiff",
  "3gpp",
  "nef",
  "x-nikon-nef",
  "x-fuji-raf",
  "x-samsung-srw",
  "mpeg",
  "x-flv",
  "x-ms-wmv",
  "x-matroska",
]

export function isSupportedFileType(mimeType: string): boolean {
  return mimeType.match(new RegExp(`/(${supportedFileTypes.join("|")})$`)) ? true : false
}
