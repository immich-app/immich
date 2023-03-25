import { join } from 'node:path';
import { APP_MEDIA_LOCATION } from '../domain.constant';

export enum StorageFolder {
  ENCODED_VIDEO = 'encoded-video',
  LIBRARY = 'library',
  UPLOAD = 'upload',
  PROFILE = 'profile',
  THUMBNAILS = 'thumbs',
}

export class StorageCore {
  getFolderLocation(folder: StorageFolder, userId: string) {
    return join(APP_MEDIA_LOCATION, folder, userId);
  }
}
