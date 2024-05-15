import { Inject, Injectable } from '@nestjs/common';
import handlebar from 'handlebars';
import { DateTime } from 'luxon';
import path from 'node:path';
import sanitize from 'sanitize-filename';
import { SystemConfig } from 'src/config';
import {
  supportedDayTokens,
  supportedHourTokens,
  supportedMinuteTokens,
  supportedMonthTokens,
  supportedSecondTokens,
  supportedWeekTokens,
  supportedYearTokens,
} from 'src/constants';
import { StorageCore, StorageFolder } from 'src/cores/storage.core';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { OnServerEvent } from 'src/decorators';
import { AssetEntity, AssetType } from 'src/entities/asset.entity';
import { AssetPathType } from 'src/entities/move.entity';
import { IAlbumRepository } from 'src/interfaces/album.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { DatabaseLock, IDatabaseRepository } from 'src/interfaces/database.interface';
import { ServerAsyncEvent, ServerAsyncEventMap } from 'src/interfaces/event.interface';
import { IEntityJob, JOBS_ASSET_PAGINATION_SIZE, JobStatus } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMoveRepository } from 'src/interfaces/move.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { getLivePhotoMotionFilename } from 'src/utils/file';
import { usePagination } from 'src/utils/pagination';

export interface MoveAssetMetadata {
  storageLabel: string | null;
  filename: string;
}

interface RenderMetadata {
  asset: AssetEntity;
  filename: string;
  extension: string;
  albumName: string | null;
}

@Injectable()
export class StorageTemplateService {
  private configCore: SystemConfigCore;
  private storageCore: StorageCore;
  private _template: {
    compiled: HandlebarsTemplateDelegate<any>;
    raw: string;
    needsAlbum: boolean;
  } | null = null;

  private get template() {
    if (!this._template) {
      throw new Error('Template not initialized');
    }
    return this._template;
  }

  constructor(
    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ISystemMetadataRepository) systemMetadataRepository: ISystemMetadataRepository,
    @Inject(IMoveRepository) moveRepository: IMoveRepository,
    @Inject(IPersonRepository) personRepository: IPersonRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(ICryptoRepository) cryptoRepository: ICryptoRepository,
    @Inject(IDatabaseRepository) private databaseRepository: IDatabaseRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(StorageTemplateService.name);
    this.configCore = SystemConfigCore.create(systemMetadataRepository, this.logger);
    this.configCore.config$.subscribe((config) => this.onConfig(config));
    this.storageCore = StorageCore.create(
      assetRepository,
      cryptoRepository,
      moveRepository,
      personRepository,
      storageRepository,
      systemMetadataRepository,
      this.logger,
    );
  }

  @OnServerEvent(ServerAsyncEvent.CONFIG_VALIDATE)
  onValidateConfig({ newConfig }: ServerAsyncEventMap[ServerAsyncEvent.CONFIG_VALIDATE]) {
    try {
      const { compiled } = this.compile(newConfig.storageTemplate.template);
      this.render(compiled, {
        asset: {
          fileCreatedAt: new Date(),
          originalPath: '/upload/test/IMG_123.jpg',
          type: AssetType.IMAGE,
          id: 'd587e44b-f8c0-4832-9ba3-43268bbf5d4e',
        } as AssetEntity,
        filename: 'IMG_123',
        extension: 'jpg',
        albumName: 'album',
      });
    } catch (error) {
      this.logger.warn(`Storage template validation failed: ${JSON.stringify(error)}`);
      throw new Error(`Invalid storage template: ${error}`);
    }
  }

  async handleMigrationSingle({ id }: IEntityJob): Promise<JobStatus> {
    const config = await this.configCore.getConfig();
    const storageTemplateEnabled = config.storageTemplate.enabled;
    if (!storageTemplateEnabled) {
      return JobStatus.SKIPPED;
    }

    const [asset] = await this.assetRepository.getByIds([id], { exifInfo: true });
    if (!asset) {
      return JobStatus.FAILED;
    }

    const user = await this.userRepository.get(asset.ownerId, {});
    const storageLabel = user?.storageLabel || null;
    const filename = asset.originalFileName || asset.id;
    await this.moveAsset(asset, { storageLabel, filename });

    // move motion part of live photo
    if (asset.livePhotoVideoId) {
      const [livePhotoVideo] = await this.assetRepository.getByIds([asset.livePhotoVideoId], { exifInfo: true });
      if (!livePhotoVideo) {
        return JobStatus.FAILED;
      }
      const motionFilename = getLivePhotoMotionFilename(filename, livePhotoVideo.originalPath);
      await this.moveAsset(livePhotoVideo, { storageLabel, filename: motionFilename });
    }
    return JobStatus.SUCCESS;
  }

  async handleMigration(): Promise<JobStatus> {
    this.logger.log('Starting storage template migration');
    const { storageTemplate } = await this.configCore.getConfig();
    const { enabled } = storageTemplate;
    if (!enabled) {
      this.logger.log('Storage template migration disabled, skipping');
      return JobStatus.SKIPPED;
    }
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.assetRepository.getAll(pagination, { withExif: true }),
    );
    const users = await this.userRepository.getList();

    for await (const assets of assetPagination) {
      for (const asset of assets) {
        const user = users.find((user) => user.id === asset.ownerId);
        const storageLabel = user?.storageLabel || null;
        const filename = asset.originalFileName || asset.id;
        await this.moveAsset(asset, { storageLabel, filename });
      }
    }

    this.logger.debug('Cleaning up empty directories...');
    const libraryFolder = StorageCore.getBaseFolder(StorageFolder.LIBRARY);
    await this.storageRepository.removeEmptyDirs(libraryFolder);

    this.logger.log('Finished storage template migration');

    return JobStatus.SUCCESS;
  }

  async moveAsset(asset: AssetEntity, metadata: MoveAssetMetadata) {
    if (asset.isExternal || StorageCore.isAndroidMotionPath(asset.originalPath)) {
      // External assets are not affected by storage template
      // TODO: shouldn't this only apply to external assets?
      return;
    }

    return this.databaseRepository.withLock(DatabaseLock.StorageTemplateMigration, async () => {
      const { id, sidecarPath, originalPath, exifInfo, checksum } = asset;
      const oldPath = originalPath;
      const newPath = await this.getTemplatePath(asset, metadata);

      if (!exifInfo || !exifInfo.fileSizeInByte) {
        this.logger.error(`Asset ${id} missing exif info, skipping storage template migration`);
        return;
      }

      try {
        await this.storageCore.moveFile({
          entityId: id,
          pathType: AssetPathType.ORIGINAL,
          oldPath,
          newPath,
          assetInfo: { sizeInBytes: exifInfo.fileSizeInByte, checksum },
        });
        if (sidecarPath) {
          await this.storageCore.moveFile({
            entityId: id,
            pathType: AssetPathType.SIDECAR,
            oldPath: sidecarPath,
            newPath: `${newPath}.xmp`,
          });
        }
      } catch (error: any) {
        this.logger.error(`Problem applying storage template`, error?.stack, { id, oldPath, newPath });
      }
    });
  }

  private async getTemplatePath(asset: AssetEntity, metadata: MoveAssetMetadata): Promise<string> {
    const { storageLabel, filename } = metadata;

    try {
      const source = asset.originalPath;
      const extension = path.extname(source).split('.').pop() as string;
      const sanitized = sanitize(path.basename(filename, `.${extension}`));
      const rootPath = StorageCore.getLibraryFolder({ id: asset.ownerId, storageLabel });

      let albumName = null;
      if (this.template.needsAlbum) {
        const albums = await this.albumRepository.getByAssetId(asset.ownerId, asset.id);
        albumName = albums?.[0]?.albumName || null;
      }

      const storagePath = this.render(this.template.compiled, {
        asset,
        filename: sanitized,
        extension: extension,
        albumName,
      });
      const fullPath = path.normalize(path.join(rootPath, storagePath));
      let destination = `${fullPath}.${extension}`;

      if (!fullPath.startsWith(rootPath)) {
        this.logger.warn(`Skipped attempt to access an invalid path: ${fullPath}. Path should start with ${rootPath}`);
        return source;
      }

      if (source === destination) {
        return source;
      }

      /**
       * In case of migrating duplicate filename to a new path, we need to check if it is already migrated
       * Due to the mechanism of appending +1, +2, +3, etc to the filename
       *
       * Example:
       * Source = upload/abc/def/FullSizeRender+7.heic
       * Expected Destination = upload/abc/def/FullSizeRender.heic
       *
       * The file is already at the correct location, but since there are other FullSizeRender.heic files in the
       * destination, it was renamed to FullSizeRender+7.heic.
       *
       * The lines below will be used to check if the differences between the source and destination is only the
       * +7 suffix, and if so, it will be considered as already migrated.
       */
      if (source.startsWith(fullPath) && source.endsWith(`.${extension}`)) {
        const diff = source.replace(fullPath, '').replace(`.${extension}`, '');
        const hasDuplicationAnnotation = /^\+\d+$/.test(diff);
        if (hasDuplicationAnnotation) {
          return source;
        }
      }

      let duplicateCount = 0;

      while (true) {
        const exists = await this.storageRepository.checkFileExists(destination);
        if (!exists) {
          break;
        }

        duplicateCount++;
        destination = `${fullPath}+${duplicateCount}.${extension}`;
      }

      return destination;
    } catch (error: any) {
      this.logger.error(`Unable to get template path for ${filename}`, error);
      return asset.originalPath;
    }
  }

  private onConfig(config: SystemConfig) {
    const template = config.storageTemplate.template;
    if (!this._template || template !== this.template.raw) {
      this.logger.debug(`Compiling new storage template: ${template}`);
      this._template = this.compile(template);
    }
  }

  private compile(template: string) {
    return {
      raw: template,
      compiled: handlebar.compile(template, { knownHelpers: undefined, strict: true }),
      needsAlbum: template.includes('{{album}}'),
    };
  }

  private render(template: HandlebarsTemplateDelegate<any>, options: RenderMetadata) {
    const { filename, extension, asset, albumName } = options;
    const substitutions: Record<string, string> = {
      filename,
      ext: extension,
      filetype: asset.type == AssetType.IMAGE ? 'IMG' : 'VID',
      filetypefull: asset.type == AssetType.IMAGE ? 'IMAGE' : 'VIDEO',
      assetId: asset.id,
      //just throw into the root if it doesn't belong to an album
      album: (albumName && sanitize(albumName.replaceAll(/\.+/g, ''))) || '.',
    };

    const systemTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const zone = asset.exifInfo?.timeZone || systemTimeZone;
    const dt = DateTime.fromJSDate(asset.fileCreatedAt, { zone });

    const dateTokens = [
      ...supportedYearTokens,
      ...supportedMonthTokens,
      ...supportedWeekTokens,
      ...supportedDayTokens,
      ...supportedHourTokens,
      ...supportedMinuteTokens,
      ...supportedSecondTokens,
    ];

    for (const token of dateTokens) {
      substitutions[token] = dt.toFormat(token);
    }

    return template(substitutions);
  }
}
