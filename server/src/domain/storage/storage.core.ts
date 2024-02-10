import { SystemConfigCore } from '@app/domain/system-config';
import { AssetEntity, AssetPathType, PathType, PersonEntity, PersonPathType } from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { dirname, join, resolve } from 'node:path';
import { APP_MEDIA_LOCATION } from '../domain.constant';
import {
  IAssetRepository,
  ICryptoRepository,
  IMoveRepository,
  IPersonRepository,
  IStorageRepository,
  ISystemConfigRepository,
} from '../repositories';

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
  assetInfo?: {
    sizeInBytes: number;
    checksum: Buffer;
  };
}

type GeneratedAssetPath = AssetPathType.JPEG_THUMBNAIL | AssetPathType.WEBP_THUMBNAIL | AssetPathType.ENCODED_VIDEO;

let instance: StorageCore | null;

export class StorageCore {
  private logger = new ImmichLogger(StorageCore.name);
  private configCore;
  private constructor(
    private assetRepository: IAssetRepository,
    private moveRepository: IMoveRepository,
    private personRepository: IPersonRepository,
    private cryptoRepository: ICryptoRepository,
    private systemConfigRepository: ISystemConfigRepository,
    private repository: IStorageRepository,
  ) {
    this.configCore = SystemConfigCore.create(systemConfigRepository);
  }

  static create(
    assetRepository: IAssetRepository,
    moveRepository: IMoveRepository,
    personRepository: IPersonRepository,
    cryptoRepository: ICryptoRepository,
    configRepository: ISystemConfigRepository,
    repository: IStorageRepository,
  ) {
    if (!instance) {
      instance = new StorageCore(
        assetRepository,
        moveRepository,
        personRepository,
        cryptoRepository,
        configRepository,
        repository,
      );
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

  static getAndroidMotionPath(asset: AssetEntity, uuid: string) {
    return StorageCore.getNestedPath(StorageFolder.ENCODED_VIDEO, asset.ownerId, `${uuid}-MP.mp4`);
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
      case AssetPathType.JPEG_THUMBNAIL: {
        return this.moveFile({
          entityId,
          pathType,
          oldPath: resizePath,
          newPath: StorageCore.getLargeThumbnailPath(asset),
        });
      }
      case AssetPathType.WEBP_THUMBNAIL: {
        return this.moveFile({
          entityId,
          pathType,
          oldPath: webpPath,
          newPath: StorageCore.getSmallThumbnailPath(asset),
        });
      }
      case AssetPathType.ENCODED_VIDEO: {
        return this.moveFile({
          entityId,
          pathType,
          oldPath: encodedVideoPath,
          newPath: StorageCore.getEncodedVideoPath(asset),
        });
      }
    }
  }

  async movePersonFile(person: PersonEntity, pathType: PersonPathType) {
    const { id: entityId, thumbnailPath } = person;
    switch (pathType) {
      case PersonPathType.FACE: {
        await this.moveFile({
          entityId,
          pathType,
          oldPath: thumbnailPath,
          newPath: StorageCore.getPersonThumbnailPath(person),
        });
      }
    }
  }

  async moveFile(request: MoveRequest) {
    const { entityId, pathType, oldPath, newPath, assetInfo } = request;
    if (!oldPath || oldPath === newPath) {
      return;
    }

    this.ensureFolders(newPath);

    let move = await this.moveRepository.getByEntity(entityId, pathType);
    if (move) {
      this.logger.log(`Attempting to finish incomplete move: ${move.oldPath} => ${move.newPath}`);
      const oldPathExists = await this.repository.checkFileExists(move.oldPath);
      const newPathExists = await this.repository.checkFileExists(move.newPath);
      const newPathCheck = newPathExists ? move.newPath : null;
      const actualPath = oldPathExists ? move.oldPath : newPathCheck;
      if (!actualPath) {
        this.logger.warn('Unable to complete move. File does not exist at either location.');
        return;
      }

      const fileAtNewLocation = actualPath === move.newPath;
      this.logger.log(`Found file at ${fileAtNewLocation ? 'new' : 'old'} location`);

      if (
        fileAtNewLocation &&
        !(await this.verifyNewPathContentsMatchesExpected(move.oldPath, move.newPath, assetInfo))
      ) {
        this.logger.fatal(
          `Skipping move as file verification failed, old file is missing and new file is different to what was expected`,
        );
        return;
      }

      move = await this.moveRepository.update({ id: move.id, oldPath: actualPath, newPath });
    } else {
      move = await this.moveRepository.create({ entityId, pathType, oldPath, newPath });
    }

    if (pathType === AssetPathType.ORIGINAL && !assetInfo) {
      this.logger.warn(`Unable to complete move. Missing asset info for ${entityId}`);
      return;
    }

    if (move.oldPath !== newPath) {
      try {
        this.logger.debug(`Attempting to rename file: ${move.oldPath} => ${newPath}`);
        await this.repository.rename(move.oldPath, newPath);
      } catch (error: any) {
        if (error.code !== 'EXDEV') {
          this.logger.warn(
            `Unable to complete move. Error renaming file with code ${error.code} and message: ${error.message}`,
          );
          return;
        }
        this.logger.debug(`Unable to rename file. Falling back to copy, verify and delete`);
        await this.repository.copyFile(move.oldPath, newPath);

        if (!(await this.verifyNewPathContentsMatchesExpected(move.oldPath, newPath, assetInfo))) {
          this.logger.warn(`Skipping move due to file size mismatch`);
          await this.repository.unlink(newPath);
          return;
        }

        try {
          await this.repository.unlink(move.oldPath);
        } catch (error: any) {
          this.logger.warn(`Unable to delete old file, it will now no longer be tracked by Immich: ${error.message}`);
        }
      }
    }

    await this.savePath(pathType, entityId, newPath);
    await this.moveRepository.delete(move);
  }

  private async verifyNewPathContentsMatchesExpected(
    oldPath: string,
    newPath: string,
    assetInfo?: { sizeInBytes: number; checksum: Buffer },
  ) {
    const oldStat = await this.repository.stat(oldPath);
    const newStat = await this.repository.stat(newPath);
    const oldPathSize = assetInfo ? assetInfo.sizeInBytes : oldStat.size;
    const newPathSize = newStat.size;
    this.logger.debug(`File size check: ${newPathSize} === ${oldPathSize}`);
    if (newPathSize !== oldPathSize) {
      this.logger.warn(`Unable to complete move. File size mismatch: ${newPathSize} !== ${oldPathSize}`);
      return false;
    }
    const config = await this.configCore.getConfig();
    if (assetInfo && config.storageTemplate.hashVerificationEnabled) {
      const { checksum } = assetInfo;
      const newChecksum = await this.cryptoRepository.hashFile(newPath);
      if (!newChecksum.equals(checksum)) {
        this.logger.warn(
          `Unable to complete move. File checksum mismatch: ${newChecksum.toString('base64')} !== ${checksum.toString(
            'base64',
          )}`,
        );
        return false;
      }
      this.logger.debug(`File checksum check: ${newChecksum.toString('base64')} === ${checksum.toString('base64')}`);
    }
    return true;
  }

  ensureFolders(input: string) {
    this.repository.mkdirSync(dirname(input));
  }

  removeEmptyDirs(folder: StorageFolder) {
    return this.repository.removeEmptyDirs(StorageCore.getBaseFolder(folder));
  }

  private savePath(pathType: PathType, id: string, newPath: string) {
    switch (pathType) {
      case AssetPathType.ORIGINAL: {
        return this.assetRepository.save({ id, originalPath: newPath });
      }
      case AssetPathType.JPEG_THUMBNAIL: {
        return this.assetRepository.save({ id, resizePath: newPath });
      }
      case AssetPathType.WEBP_THUMBNAIL: {
        return this.assetRepository.save({ id, webpPath: newPath });
      }
      case AssetPathType.ENCODED_VIDEO: {
        return this.assetRepository.save({ id, encodedVideoPath: newPath });
      }
      case AssetPathType.SIDECAR: {
        return this.assetRepository.save({ id, sidecarPath: newPath });
      }
      case PersonPathType.FACE: {
        return this.personRepository.update({ id, thumbnailPath: newPath });
      }
    }
  }

  static getNestedFolder(folder: StorageFolder, ownerId: string, filename: string): string {
    return join(StorageCore.getFolderLocation(folder, ownerId), filename.slice(0, 2), filename.slice(2, 4));
  }

  static getNestedPath(folder: StorageFolder, ownerId: string, filename: string): string {
    return join(this.getNestedFolder(folder, ownerId, filename), filename);
  }
}
