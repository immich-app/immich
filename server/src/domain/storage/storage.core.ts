import { AssetEntity, AssetPathType, PathType, PersonEntity, PersonPathType } from '@app/infra/entities';
import { Logger } from '@nestjs/common';
import { dirname, join } from 'node:path';
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

export class StorageCore {
  private logger = new Logger(StorageCore.name);

  constructor(
    private repository: IStorageRepository,
    private assetRepository: IAssetRepository,
    private moveRepository: IMoveRepository,
    private personRepository: IPersonRepository,
  ) {}

  getFolderLocation(folder: StorageFolder, userId: string) {
    return join(this.getBaseFolder(folder), userId);
  }

  getLibraryFolder(user: { storageLabel: string | null; id: string }) {
    return join(this.getBaseFolder(StorageFolder.LIBRARY), user.storageLabel || user.id);
  }

  getBaseFolder(folder: StorageFolder) {
    return join(APP_MEDIA_LOCATION, folder);
  }

  getPersonThumbnailPath(person: PersonEntity) {
    return this.getNestedPath(StorageFolder.THUMBNAILS, person.ownerId, `${person.id}.jpeg`);
  }

  getLargeThumbnailPath(asset: AssetEntity) {
    return this.getNestedPath(StorageFolder.THUMBNAILS, asset.ownerId, `${asset.id}.jpeg`);
  }

  getSmallThumbnailPath(asset: AssetEntity) {
    return this.getNestedPath(StorageFolder.THUMBNAILS, asset.ownerId, `${asset.id}.webp`);
  }

  getEncodedVideoPath(asset: AssetEntity) {
    return this.getNestedPath(StorageFolder.ENCODED_VIDEO, asset.ownerId, `${asset.id}.mp4`);
  }

  getAndroidMotionPath(asset: AssetEntity) {
    return this.getNestedPath(StorageFolder.ENCODED_VIDEO, asset.ownerId, `${asset.id}-MP.mp4`);
  }

  isAndroidMotionPath(originalPath: string) {
    return originalPath.startsWith(this.getBaseFolder(StorageFolder.ENCODED_VIDEO));
  }

  async moveAssetFile(asset: AssetEntity, pathType: GeneratedAssetPath) {
    const { id: entityId, resizePath, webpPath, encodedVideoPath } = asset;
    switch (pathType) {
      case AssetPathType.JPEG_THUMBNAIL:
        return this.moveFile({ entityId, pathType, oldPath: resizePath, newPath: this.getLargeThumbnailPath(asset) });
      case AssetPathType.WEBP_THUMBNAIL:
        return this.moveFile({ entityId, pathType, oldPath: webpPath, newPath: this.getSmallThumbnailPath(asset) });
      case AssetPathType.ENCODED_VIDEO:
        return this.moveFile({
          entityId,
          pathType,
          oldPath: encodedVideoPath,
          newPath: this.getEncodedVideoPath(asset),
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
          newPath: this.getPersonThumbnailPath(person),
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
    return this.repository.removeEmptyDirs(this.getBaseFolder(folder));
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

  private getNestedPath(folder: StorageFolder, ownerId: string, filename: string): string {
    return join(this.getFolderLocation(folder, ownerId), filename.substring(0, 2), filename.substring(2, 4), filename);
  }
}
