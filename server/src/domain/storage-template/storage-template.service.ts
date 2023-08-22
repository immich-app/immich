import { AssetEntity, AssetType, SystemConfig } from '@app/infra/entities';
import { Inject, Injectable, Logger } from '@nestjs/common';
import handlebar from 'handlebars';
import * as luxon from 'luxon';
import path from 'node:path';
import sanitize from 'sanitize-filename';
import { IAssetRepository } from '../asset/asset.repository';
import { getLivePhotoMotionFilename, usePagination } from '../domain.util';
import { IEntityJob, JOBS_ASSET_PAGINATION_SIZE } from '../job';
import { IStorageRepository, StorageCore, StorageFolder } from '../storage';
import {
  INITIAL_SYSTEM_CONFIG,
  ISystemConfigRepository,
  supportedDayTokens,
  supportedHourTokens,
  supportedMinuteTokens,
  supportedMonthTokens,
  supportedSecondTokens,
  supportedYearTokens,
} from '../system-config';
import { SystemConfigCore } from '../system-config/system-config.core';
import { IUserRepository } from '../user/user.repository';

export interface MoveAssetMetadata {
  storageLabel: string | null;
  filename: string;
}

@Injectable()
export class StorageTemplateService {
  private logger = new Logger(StorageTemplateService.name);
  private configCore: SystemConfigCore;
  private storageCore = new StorageCore();
  private storageTemplate: HandlebarsTemplateDelegate<any>;

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(INITIAL_SYSTEM_CONFIG) config: SystemConfig,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
  ) {
    this.storageTemplate = this.compile(config.storageTemplate.template);
    this.configCore = new SystemConfigCore(configRepository);
    this.configCore.addValidator((config) => this.validate(config));
    this.configCore.config$.subscribe((config) => this.onConfig(config));
  }

  async handleMigrationSingle({ id }: IEntityJob) {
    const [asset] = await this.assetRepository.getByIds([id]);

    const user = await this.userRepository.get(asset.ownerId);
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
    const libraryFolder = this.storageCore.getBaseFolder(StorageFolder.LIBRARY);
    await this.storageRepository.removeEmptyDirs(libraryFolder);

    this.logger.log('Finished storage template migration');

    return true;
  }

  // TODO: use asset core (once in domain)
  async moveAsset(asset: AssetEntity, metadata: MoveAssetMetadata) {
    if (asset.isReadOnly) {
      this.logger.verbose(`Not moving read-only asset: ${asset.originalPath}`);
      return;
    }

    const destination = await this.getTemplatePath(asset, metadata);
    if (asset.originalPath !== destination) {
      const source = asset.originalPath;

      let sidecarMoved = false;
      try {
        await this.storageRepository.moveFile(asset.originalPath, destination);

        let sidecarDestination;
        try {
          if (asset.sidecarPath) {
            sidecarDestination = `${destination}.xmp`;
            await this.storageRepository.moveFile(asset.sidecarPath, sidecarDestination);
            sidecarMoved = true;
          }

          await this.assetRepository.save({ id: asset.id, originalPath: destination, sidecarPath: sidecarDestination });
          asset.originalPath = destination;
          asset.sidecarPath = sidecarDestination || null;
        } catch (error: any) {
          this.logger.warn(
            `Unable to save new originalPath to database, undoing move for path ${asset.originalPath} - filename ${asset.originalFileName} - id ${asset.id}`,
            error?.stack,
          );

          // Either sidecar move failed or the save failed. Eithr way, move media back
          await this.storageRepository.moveFile(destination, source);

          if (asset.sidecarPath && sidecarDestination && sidecarMoved) {
            // If the sidecar was moved, that means the saved failed. So move both the sidecar and the
            // media back into their original positions
            await this.storageRepository.moveFile(sidecarDestination, asset.sidecarPath);
          }
        }
      } catch (error: any) {
        this.logger.error(`Problem applying storage template`, error?.stack, { id: asset.id, source, destination });
      }
    }
    return asset;
  }

  private async getTemplatePath(asset: AssetEntity, metadata: MoveAssetMetadata): Promise<string> {
    const { storageLabel, filename } = metadata;

    try {
      const source = asset.originalPath;
      const ext = path.extname(source).split('.').pop() as string;
      const sanitized = sanitize(path.basename(filename, `.${ext}`));
      const rootPath = this.storageCore.getLibraryFolder({ id: asset.ownerId, storageLabel });
      const storagePath = this.render(this.storageTemplate, asset, sanitized, ext);
      const fullPath = path.normalize(path.join(rootPath, storagePath));
      let destination = `${fullPath}.${ext}`;

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
      if (source.startsWith(fullPath) && source.endsWith(`.${ext}`)) {
        const diff = source.replace(fullPath, '').replace(`.${ext}`, '');
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
        destination = `${fullPath}+${duplicateCount}.${ext}`;
      }

      return destination;
    } catch (error: any) {
      this.logger.error(`Unable to get template path for ${filename}`, error);
      return asset.originalPath;
    }
  }

  private validate(config: SystemConfig) {
    const testAsset = {
      fileCreatedAt: new Date(),
      originalPath: '/upload/test/IMG_123.jpg',
      type: AssetType.IMAGE,
    } as AssetEntity;
    try {
      this.render(this.compile(config.storageTemplate.template), testAsset, 'IMG_123', 'jpg');
    } catch (e) {
      this.logger.warn(`Storage template validation failed: ${JSON.stringify(e)}`);
      throw new Error(`Invalid storage template: ${e}`);
    }
  }

  private onConfig(config: SystemConfig) {
    this.logger.debug(`Received new config, recompiling storage template: ${config.storageTemplate.template}`);
    this.storageTemplate = this.compile(config.storageTemplate.template);
  }

  private compile(template: string) {
    return handlebar.compile(template, {
      knownHelpers: undefined,
      strict: true,
    });
  }

  private render(template: HandlebarsTemplateDelegate<any>, asset: AssetEntity, filename: string, ext: string) {
    const substitutions: Record<string, string> = {
      filename,
      ext,
      filetype: asset.type == AssetType.IMAGE ? 'IMG' : 'VID',
      filetypefull: asset.type == AssetType.IMAGE ? 'IMAGE' : 'VIDEO',
    };

    const dt = luxon.DateTime.fromJSDate(asset.fileCreatedAt, { zone: asset.exifInfo?.timeZone || undefined });

    const dateTokens = [
      ...supportedYearTokens,
      ...supportedMonthTokens,
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
