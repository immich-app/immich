import { AssetEntity, AssetPathType, PathType, PersonEntity, PersonPathType } from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { dirname, join, resolve } from 'node:path';
import { APP_MEDIA_LOCATION } from '../domain.constant';
import { IAssetRepository, IMoveRepository, IPersonRepository, IStorageRepository } from '../repositories';

export enum StorageFolder {
  ENCODED_VIDEO = 'encoded-video',
  LIBRARY = 'library',
  UPLOAD = 'upload',
  PROFILE = 'profile',
  THUMBNAILS = 'thumbs',
}

export interface MoveRequest {
  entityId: string;
  pathType: PathType;
  oldPath: string | null;
  newPath: string;
}

type GeneratedAssetPath = AssetPathType.JPEG_THUMBNAIL | AssetPathType.WEBP_THUMBNAIL | AssetPathType.ENCODED_VIDEO;

let instance: StorageCore | null;

export class StorageCore {
  private logger = new ImmichLogger(StorageCore.name);

  private constructor(
    private assetRepository: IAssetRepository,
    private moveRepository: IMoveRepository,
    private personRepository: IPersonRepository,
    private repository: IStorageRepository,
  ) {}

  static create(
    assetRepository: IAssetRepository,
    moveRepository: IMoveRepository,
    personRepository: IPersonRepository,
    repository: IStorageRepository,
  ) {
    if (!instance) {
      instance = new StorageCore(assetRepository, moveRepository, personRepository, repository);
    }

    return instance;
  }

  static reset() {
    instance = null;
  }

  static getFolderLocation(folder: StorageFolder, userId: string) {
    return join(StorageCore.getBaseFolder(folder), userId);
  }

  static getLibraryFolder(user: { storageLabel: string | null; id: string }) {
    return join(StorageCore.getBaseFolder(StorageFolder.LIBRARY), user.storageLabel || user.id);
  }

  static getBaseFolder(folder: StorageFolder) {
    return join(APP_MEDIA_LOCATION, folder);
  }

  static getPersonThumbnailPath(person: PersonEntity) {
    return StorageCore.getNestedPath(StorageFolder.THUMBNAILS, person.ownerId, `${person.id}.jpeg`);
  }

  static getLargeThumbnailPath(asset: AssetEntity) {
    return StorageCore.getNestedPath(StorageFolder.THUMBNAILS, asset.ownerId, `${asset.id}.jpeg`);
  }

  static getSmallThumbnailPath(asset: AssetEntity) {
    return StorageCore.getNestedPath(StorageFolder.THUMBNAILS, asset.ownerId, `${asset.id}.webp`);
  }

  static getEncodedVideoPath(asset: AssetEntity) {
    return StorageCore.getNestedPath(StorageFolder.ENCODED_VIDEO, asset.ownerId, `${asset.id}.mp4`);
  }

  static getAndroidMotionPath(asset: AssetEntity) {
    return StorageCore.getNestedPath(StorageFolder.ENCODED_VIDEO, asset.ownerId, `${asset.id}-MP.mp4`);
  }

  static isAndroidMotionPath(originalPath: string) {
    return originalPath.startsWith(StorageCore.getBaseFolder(StorageFolder.ENCODED_VIDEO));
  }

  static isImmichPath(path: string) {
    return resolve(path).startsWith(resolve(APP_MEDIA_LOCATION));
  }

  async moveAssetFile(asset: AssetEntity, pathType: GeneratedAssetPath) {
    const { id: entityId, resizePath, webpPath, encodedVideoPath } = asset;
    switch (pathType) {
      case AssetPathType.JPEG_THUMBNAIL:
        return this.moveFile({
          entityId,
          pathType,
          oldPath: resizePath,
          newPath: StorageCore.getLargeThumbnailPath(asset),
        });
      case AssetPathType.WEBP_THUMBNAIL:
        return this.moveFile({
          entityId,
          pathType,
          oldPath: webpPath,
          newPath: StorageCore.getSmallThumbnailPath(asset),
        });
      case AssetPathType.ENCODED_VIDEO:
        return this.moveFile({
          entityId,
          pathType,
          oldPath: encodedVideoPath,
          newPath: StorageCore.getEncodedVideoPath(asset),
        });
    }
  }

  async movePersonFile(person: PersonEntity, pathType: PersonPathType) {
    const { id: entityId, thumbnailPath } = person;
    switch (pathType) {
      case PersonPathType.FACE:
        await this.moveFile({
          entityId,
          pathType,
          oldPath: thumbnailPath,
          newPath: StorageCore.getPersonThumbnailPath(person),
        });
    }
  }

  async moveFile(request: MoveRequest) {
    const { entityId, pathType, oldPath, newPath } = request;
    if (!oldPath || oldPath === newPath) {
      return;
    }

    this.ensureFolders(newPath);

    let move = await this.moveRepository.getByEntity(entityId, pathType);
    if (move) {
      this.logger.log(`Attempting to finish incomplete move: ${move.oldPath} => ${move.newPath}`);
      const oldPathExists = await this.repository.checkFileExists(move.oldPath);
      const newPathExists = await this.repository.checkFileExists(move.newPath);
      const actualPath = newPathExists ? move.newPath : oldPathExists ? move.oldPath : null;
      if (!actualPath) {
        this.logger.warn('Unable to complete move. File does not exist at either location.');
        return;
      }

      this.logger.log(`Found file at ${actualPath === move.oldPath ? 'old' : 'new'} location`);

      move = await this.moveRepository.update({ id: move.id, oldPath: actualPath, newPath });
    } else {
      move = await this.moveRepository.create({ entityId, pathType, oldPath, newPath });
    }

    if (move.oldPath !== newPath) {
      await this.repository.moveFile(move.oldPath, newPath);
    }
    await this.savePath(pathType, entityId, newPath);
    await this.moveRepository.delete(move);
  }

  ensureFolders(input: string) {
    this.repository.mkdirSync(dirname(input));
  }

  removeEmptyDirs(folder: StorageFolder) {
    return this.repository.removeEmptyDirs(StorageCore.getBaseFolder(folder));
  }

  private savePath(pathType: PathType, id: string, newPath: string) {
    switch (pathType) {
      case AssetPathType.ORIGINAL:
        return this.assetRepository.save({ id, originalPath: newPath });
      case AssetPathType.JPEG_THUMBNAIL:
        return this.assetRepository.save({ id, resizePath: newPath });
      case AssetPathType.WEBP_THUMBNAIL:
        return this.assetRepository.save({ id, webpPath: newPath });
      case AssetPathType.ENCODED_VIDEO:
        return this.assetRepository.save({ id, encodedVideoPath: newPath });
      case AssetPathType.SIDECAR:
        return this.assetRepository.save({ id, sidecarPath: newPath });
      case PersonPathType.FACE:
        return this.personRepository.update({ id, thumbnailPath: newPath });
    }
  }

  private static getNestedPath(folder: StorageFolder, ownerId: string, filename: string): string {
    return join(
      StorageCore.getFolderLocation(folder, ownerId),
      filename.substring(0, 2),
      filename.substring(2, 4),
      filename,
    );
  }
}
