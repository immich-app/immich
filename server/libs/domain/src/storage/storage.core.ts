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
  getFolderLocation(
    folder: StorageFolder.ENCODED_VIDEO | StorageFolder.UPLOAD | StorageFolder.PROFILE | StorageFolder.THUMBNAILS,
    userId: string,
  ) {
    return join(APP_MEDIA_LOCATION, folder, userId);
  }

  getLibraryFolder(user: { storageLabel: string | null; id: string }) {
    return join(APP_MEDIA_LOCATION, StorageFolder.LIBRARY, user.storageLabel || user.id);
  }
}
