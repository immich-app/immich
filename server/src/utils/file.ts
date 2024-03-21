import { basename, extname } from 'node:path';

export function getFileNameWithoutExtension(path: string): string {
  return basename(path, extname(path));
}

export function getLivePhotoMotionFilename(stillName: string, motionName: string) {
  return getFileNameWithoutExtension(stillName) + extname(motionName);
}

export enum CacheControl {
  PRIVATE_WITH_CACHE = 'private_with_cache',
  PRIVATE_WITHOUT_CACHE = 'private_without_cache',
  NONE = 'none',
}

export class ImmichFileResponse {
  public readonly path!: string;
  public readonly contentType!: string;
  public readonly cacheControl!: CacheControl;

  constructor(response: ImmichFileResponse) {
    Object.assign(this, response);
  }
}
