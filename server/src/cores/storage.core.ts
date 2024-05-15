import { randomUUID } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { ImageFormat } from 'src/config';
import { APP_MEDIA_LOCATION } from 'src/constants';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { AssetEntity } from 'src/entities/asset.entity';
import { AssetPathType, PathType, PersonPathType } from 'src/entities/move.entity';
import { PersonEntity } from 'src/entities/person.entity';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMoveRepository } from 'src/interfaces/move.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';

export enum StorageFolder {
  ENCODED_VIDEO = 'encoded-video',
  LIBRARY = 'library',
  UPLOAD = 'upload',
  PROFILE = 'profile',
  THUMBNAILS = 'thumbs',
}

export const THUMBNAIL_DIR = resolve(join(APP_MEDIA_LOCATION, StorageFolder.THUMBNAILS));
export const ENCODED_VIDEO_DIR = resolve(join(APP_MEDIA_LOCATION, StorageFolder.ENCODED_VIDEO));

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

export type GeneratedImageType = AssetPathType.PREVIEW | AssetPathType.THUMBNAIL;
export type GeneratedAssetType = GeneratedImageType | AssetPathType.ENCODED_VIDEO;

let instance: StorageCore | null;

export class StorageCore {
  private configCore;
  private constructor(
    private assetRepository: IAssetRepository,
    private cryptoRepository: ICryptoRepository,
    private moveRepository: IMoveRepository,
    private personRepository: IPersonRepository,
    private storageRepository: IStorageRepository,
    systemMetadataRepository: ISystemMetadataRepository,
    private logger: ILoggerRepository,
  ) {
    this.configCore = SystemConfigCore.create(systemMetadataRepository, this.logger);
  }

  static create(
    assetRepository: IAssetRepository,
    cryptoRepository: ICryptoRepository,
    moveRepository: IMoveRepository,
    personRepository: IPersonRepository,
    storageRepository: IStorageRepository,
    systemMetadataRepository: ISystemMetadataRepository,
    logger: ILoggerRepository,
  ) {
    if (!instance) {
      instance = new StorageCore(
        assetRepository,
        cryptoRepository,
        moveRepository,
        personRepository,
        storageRepository,
        systemMetadataRepository,
        logger,
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

  static getImagePath(asset: AssetEntity, type: GeneratedImageType, format: ImageFormat) {
    return StorageCore.getNestedPath(StorageFolder.THUMBNAILS, asset.ownerId, `${asset.id}-${type}.${format}`);
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
    const resolvedPath = resolve(path);
    const resolvedAppMediaLocation = resolve(APP_MEDIA_LOCATION);
    const normalizedPath = resolvedPath.endsWith('/') ? resolvedPath : resolvedPath + '/';
    const normalizedAppMediaLocation = resolvedAppMediaLocation.endsWith('/')
      ? resolvedAppMediaLocation
      : resolvedAppMediaLocation + '/';
    return normalizedPath.startsWith(normalizedAppMediaLocation);
  }

  static isGeneratedAsset(path: string) {
    return path.startsWith(THUMBNAIL_DIR) || path.startsWith(ENCODED_VIDEO_DIR);
  }

  async moveAssetImage(asset: AssetEntity, pathType: GeneratedImageType, format: ImageFormat) {
    const { id: entityId, previewPath, thumbnailPath } = asset;
    return this.moveFile({
      entityId,
      pathType,
      oldPath: pathType === AssetPathType.PREVIEW ? previewPath : thumbnailPath,
      newPath: StorageCore.getImagePath(asset, AssetPathType.THUMBNAIL, format),
    });
  }

  async moveAssetVideo(asset: AssetEntity) {
    return this.moveFile({
      entityId: asset.id,
      pathType: AssetPathType.ENCODED_VIDEO,
      oldPath: asset.encodedVideoPath,
      newPath: StorageCore.getEncodedVideoPath(asset),
    });
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
      const oldPathExists = await this.storageRepository.checkFileExists(move.oldPath);
      const newPathExists = await this.storageRepository.checkFileExists(move.newPath);
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
        await this.storageRepository.rename(move.oldPath, newPath);
      } catch (error: any) {
        if (error.code !== 'EXDEV') {
          this.logger.warn(
            `Unable to complete move. Error renaming file with code ${error.code} and message: ${error.message}`,
          );
          return;
        }
        this.logger.debug(`Unable to rename file. Falling back to copy, verify and delete`);
        await this.storageRepository.copyFile(move.oldPath, newPath);

        if (!(await this.verifyNewPathContentsMatchesExpected(move.oldPath, newPath, assetInfo))) {
          this.logger.warn(`Skipping move due to file size mismatch`);
          await this.storageRepository.unlink(newPath);
          return;
        }

        const { atime, mtime } = await this.storageRepository.stat(move.oldPath);
        await this.storageRepository.utimes(newPath, atime, mtime);

        try {
          await this.storageRepository.unlink(move.oldPath);
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
    const oldStat = await this.storageRepository.stat(oldPath);
    const newStat = await this.storageRepository.stat(newPath);
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
    this.storageRepository.mkdirSync(dirname(input));
  }

  removeEmptyDirs(folder: StorageFolder) {
    return this.storageRepository.removeEmptyDirs(StorageCore.getBaseFolder(folder));
  }

  private savePath(pathType: PathType, id: string, newPath: string) {
    switch (pathType) {
      case AssetPathType.ORIGINAL: {
        return this.assetRepository.update({ id, originalPath: newPath });
      }
      case AssetPathType.PREVIEW: {
        return this.assetRepository.update({ id, previewPath: newPath });
      }
      case AssetPathType.THUMBNAIL: {
        return this.assetRepository.update({ id, thumbnailPath: newPath });
      }
      case AssetPathType.ENCODED_VIDEO: {
        return this.assetRepository.update({ id, encodedVideoPath: newPath });
      }
      case AssetPathType.SIDECAR: {
        return this.assetRepository.update({ id, sidecarPath: newPath });
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

  static getTempPathInDir(dir: string): string {
    return join(dir, `${randomUUID()}.tmp`);
  }
}
