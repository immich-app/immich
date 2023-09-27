import { dirname, join } from 'node:path';
import { APP_MEDIA_LOCATION } from '../domain.constant';
import { IStorageRepository } from './storage.repository';

export enum StorageFolder {
  ENCODED_VIDEO = 'encoded-video',
  LIBRARY = 'library',
  UPLOAD = 'upload',
  PROFILE = 'profile',
  THUMBNAILS = 'thumbs',
}

export class StorageCore {
  constructor(private repository: IStorageRepository) {}

  getFolderLocation(
    folder: StorageFolder.ENCODED_VIDEO | StorageFolder.UPLOAD | StorageFolder.PROFILE | StorageFolder.THUMBNAILS,
    userId: string,
  ) {
    return join(this.getBaseFolder(folder), userId);
  }

  getLibraryFolder(user: { storageLabel: string | null; id: string }) {
    return join(this.getBaseFolder(StorageFolder.LIBRARY), user.storageLabel || user.id);
  }

  getBaseFolder(folder: StorageFolder) {
    return join(APP_MEDIA_LOCATION, folder);
  }

  getDirectory(filepath: string) {
    return dirname(filepath);
  }

  ensurePath(
    folder: StorageFolder.ENCODED_VIDEO | StorageFolder.UPLOAD | StorageFolder.PROFILE | StorageFolder.THUMBNAILS,
    ownerId: string,
    fileName: string,
    create: boolean = true,
  ): string {
    const folderPath = join(
      this.getFolderLocation(folder, ownerId),
      fileName.substring(0, 2),
      fileName.substring(2, 4),
    );
    create && this.repository.mkdirSync(folderPath);
    return join(folderPath, fileName);
  }

  removeEmptyDirs(folder: StorageFolder) {
    return this.repository.removeEmptyDirs(this.getBaseFolder(folder));
  }
}
