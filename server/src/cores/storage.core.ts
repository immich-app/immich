import { randomUUID } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { APP_MEDIA_LOCATION } from 'src/constants';
import { StorageAsset } from 'src/database';
import { AssetFileType, AssetPathType, ImageFormat, PathType, PersonPathType, StorageFolder } from 'src/enum';
import { AssetRepository } from 'src/repositories/asset.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MoveRepository } from 'src/repositories/move.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { getAssetFile } from 'src/utils/asset.util';
import { getConfig } from 'src/utils/config';

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

export type GeneratedImageType = AssetPathType.PREVIEW | AssetPathType.THUMBNAIL | AssetPathType.FULLSIZE;
export type GeneratedAssetType = GeneratedImageType | AssetPathType.ENCODED_VIDEO;

export type ThumbnailPathEntity = { id: string; ownerId: string };

let instance: StorageCore | null;

export class StorageCore {
  private constructor(
    private assetRepository: AssetRepository,
    private configRepository: ConfigRepository,
    private cryptoRepository: CryptoRepository,
    private moveRepository: MoveRepository,
    private personRepository: PersonRepository,
    private storageRepository: StorageRepository,
    private systemMetadataRepository: SystemMetadataRepository,
    private logger: LoggingRepository,
  ) {}

  static create(
    assetRepository: AssetRepository,
    configRepository: ConfigRepository,
    cryptoRepository: CryptoRepository,
    moveRepository: MoveRepository,
    personRepository: PersonRepository,
    storageRepository: StorageRepository,
    systemMetadataRepository: SystemMetadataRepository,
    logger: LoggingRepository,
  ) {
    if (!instance) {
      instance = new StorageCore(
        assetRepository,
        configRepository,
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

  static getPersonThumbnailPath(person: ThumbnailPathEntity) {
    return StorageCore.getNestedPath(StorageFolder.THUMBNAILS, person.ownerId, `${person.id}.jpeg`);
  }

  static getImagePath(asset: ThumbnailPathEntity, type: GeneratedImageType, format: ImageFormat) {
    return StorageCore.getNestedPath(StorageFolder.THUMBNAILS, asset.ownerId, `${asset.id}-${type}.${format}`);
  }

  static getEncodedVideoPath(asset: ThumbnailPathEntity) {
    return StorageCore.getNestedPath(StorageFolder.ENCODED_VIDEO, asset.ownerId, `${asset.id}.mp4`);
  }

  static getAndroidMotionPath(asset: ThumbnailPathEntity, uuid: string) {
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

  async moveAssetImage(asset: StorageAsset, pathType: GeneratedImageType, format: ImageFormat) {
    const { id: entityId, files } = asset;
    const oldFile = getAssetFile(files, pathType);
    return this.moveFile({
      entityId,
      pathType,
      oldPath: oldFile?.path || null,
      newPath: StorageCore.getImagePath(asset, pathType, format),
    });
  }

  async moveAssetVideo(asset: StorageAsset) {
    return this.moveFile({
      entityId: asset.id,
      pathType: AssetPathType.ENCODED_VIDEO,
      oldPath: asset.encodedVideoPath,
      newPath: StorageCore.getEncodedVideoPath(asset),
    });
  }

  async movePersonFile(person: { id: string; ownerId: string; thumbnailPath: string }, pathType: PersonPathType) {
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

      move = await this.moveRepository.update(move.id, { id: move.id, oldPath: actualPath, newPath });
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
    await this.moveRepository.delete(move.id);
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
    const repos = {
      configRepo: this.configRepository,
      metadataRepo: this.systemMetadataRepository,
      logger: this.logger,
    };
    const config = await getConfig(repos, { withCache: true });
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
      case AssetPathType.FULLSIZE: {
        return this.assetRepository.upsertFile({ assetId: id, type: AssetFileType.FULLSIZE, path: newPath });
      }
      case AssetPathType.PREVIEW: {
        return this.assetRepository.upsertFile({ assetId: id, type: AssetFileType.PREVIEW, path: newPath });
      }
      case AssetPathType.THUMBNAIL: {
        return this.assetRepository.upsertFile({ assetId: id, type: AssetFileType.THUMBNAIL, path: newPath });
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
