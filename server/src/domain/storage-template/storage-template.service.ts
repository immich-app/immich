import { AssetEntity, AssetPathType, AssetType, SystemConfig } from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { Inject, Injectable } from '@nestjs/common';
import handlebar from 'handlebars';
import * as luxon from 'luxon';
import path from 'node:path';
import sanitize from 'sanitize-filename';
import { getLivePhotoMotionFilename, usePagination } from '../domain.util';
import { IEntityJob, JOBS_ASSET_PAGINATION_SIZE } from '../job';
import {
  DatabaseLock,
  IAlbumRepository,
  IAssetRepository,
  ICryptoRepository,
  IDatabaseRepository,
  IMoveRepository,
  IPersonRepository,
  IStorageRepository,
  ISystemConfigRepository,
  IUserRepository,
} from '../repositories';
import { StorageCore, StorageFolder } from '../storage';
import {
  supportedDayTokens,
  supportedHourTokens,
  supportedMinuteTokens,
  supportedMonthTokens,
  supportedSecondTokens,
  supportedWeekTokens,
  supportedYearTokens,
} from '../system-config';
import { SystemConfigCore } from '../system-config/system-config.core';

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
  private logger = new ImmichLogger(StorageTemplateService.name);
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
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IMoveRepository) moveRepository: IMoveRepository,
    @Inject(IPersonRepository) personRepository: IPersonRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(ICryptoRepository) cryptoRepository: ICryptoRepository,
    @Inject(IDatabaseRepository) private databaseRepository: IDatabaseRepository,
  ) {
    this.configCore = SystemConfigCore.create(configRepository);
    this.configCore.addValidator((config) => this.validate(config));
    this.configCore.config$.subscribe((config) => this.onConfig(config));
    this.storageCore = StorageCore.create(
      assetRepository,
      moveRepository,
      personRepository,
      cryptoRepository,
      configRepository,
      storageRepository,
    );
  }

  async handleMigrationSingle({ id }: IEntityJob) {
    const config = await this.configCore.getConfig();
    const storageTemplateEnabled = config.storageTemplate.enabled;
    if (!storageTemplateEnabled) {
      return true;
    }

    const [asset] = await this.assetRepository.getByIds([id]);

    const user = await this.userRepository.get(asset.ownerId, {});
    const storageLabel = user?.storageLabel || null;
    const filename = asset.originalFileName || asset.id;
    await this.moveAsset(asset, { storageLabel, filename });

    // move motion part of live photo
    if (asset.livePhotoVideoId) {
      const [livePhotoVideo] = await this.assetRepository.getByIds([asset.livePhotoVideoId]);
      const motionFilename = getLivePhotoMotionFilename(filename, livePhotoVideo.originalPath);
      await this.moveAsset(livePhotoVideo, { storageLabel, filename: motionFilename });
    }
    return true;
  }

  async handleMigration() {
    this.logger.log('Starting storage template migration');
    const { storageTemplate } = await this.configCore.getConfig();
    const { enabled } = storageTemplate;
    if (!enabled) {
      this.logger.log('Storage template migration disabled, skipping');
      return true;
    }
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.assetRepository.getAll(pagination),
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

    return true;
  }

  async moveAsset(asset: AssetEntity, metadata: MoveAssetMetadata) {
    if (asset.isReadOnly || asset.isExternal || StorageCore.isAndroidMotionPath(asset.originalPath)) {
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

  private validate(config: SystemConfig) {
    try {
      const { compiled } = this.compile(config.storageTemplate.template);
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
    const dt = luxon.DateTime.fromJSDate(asset.fileCreatedAt, { zone });

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
