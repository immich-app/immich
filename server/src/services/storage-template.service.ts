import { Injectable } from '@nestjs/common';
import handlebar from 'handlebars';
import { DateTime } from 'luxon';
import path from 'node:path';
import sanitize from 'sanitize-filename';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent, OnJob } from 'src/decorators';
import { SystemConfigTemplateStorageOptionDto } from 'src/dtos/system-config.dto';
import { AssetPathType, AssetType, DatabaseLock, JobName, JobStatus, QueueName, StorageFolder } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { JobOf, StorageAsset } from 'src/types';
import { getLivePhotoMotionFilename } from 'src/utils/file';

const storageTokens = {
  secondOptions: ['s', 'ss', 'SSS'],
  minuteOptions: ['m', 'mm'],
  dayOptions: ['d', 'dd'],
  weekOptions: ['W', 'WW'],
  hourOptions: ['h', 'hh', 'H', 'HH'],
  yearOptions: ['y', 'yy'],
  monthOptions: ['M', 'MM', 'MMM', 'MMMM'],
};

const storagePresets = [
  '{{y}}/{{y}}-{{MM}}-{{dd}}/{{filename}}',
  '{{y}}/{{MM}}-{{dd}}/{{filename}}',
  '{{y}}/{{MMMM}}-{{dd}}/{{filename}}',
  '{{y}}/{{MM}}/{{filename}}',
  '{{y}}/{{#if album}}{{album}}{{else}}Other/{{MM}}{{/if}}/{{filename}}',
  '{{y}}/{{MMM}}/{{filename}}',
  '{{y}}/{{MMMM}}/{{filename}}',
  '{{y}}/{{MM}}/{{dd}}/{{filename}}',
  '{{y}}/{{MMMM}}/{{dd}}/{{filename}}',
  '{{y}}/{{y}}-{{MM}}/{{y}}-{{MM}}-{{dd}}/{{filename}}',
  '{{y}}-{{MM}}-{{dd}}/{{filename}}',
  '{{y}}-{{MMM}}-{{dd}}/{{filename}}',
  '{{y}}-{{MMMM}}-{{dd}}/{{filename}}',
  '{{y}}/{{y}}-{{MM}}/{{filename}}',
  '{{y}}/{{y}}-{{WW}}/{{filename}}',
  '{{y}}/{{y}}-{{MM}}-{{dd}}/{{assetId}}',
  '{{y}}/{{y}}-{{MM}}/{{assetId}}',
  '{{y}}/{{y}}-{{WW}}/{{assetId}}',
  '{{album}}/{{filename}}',
];

export interface MoveAssetMetadata {
  storageLabel: string | null;
  filename: string;
}

interface RenderMetadata {
  asset: StorageAsset;
  filename: string;
  extension: string;
  albumName: string | null;
}

@Injectable()
export class StorageTemplateService extends BaseService {
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

  @OnEvent({ name: 'config.init' })
  onConfigInit({ newConfig }: ArgOf<'config.init'>) {
    const template = newConfig.storageTemplate.template;
    if (!this._template || template !== this.template.raw) {
      this.logger.debug(`Compiling new storage template: ${template}`);
      this._template = this.compile(template);
    }
  }

  @OnEvent({ name: 'config.update', server: true })
  onConfigUpdate({ newConfig }: ArgOf<'config.update'>) {
    this.onConfigInit({ newConfig });
  }

  @OnEvent({ name: 'config.validate' })
  onConfigValidate({ newConfig }: ArgOf<'config.validate'>) {
    try {
      const { compiled } = this.compile(newConfig.storageTemplate.template);
      this.render(compiled, {
        asset: {
          fileCreatedAt: new Date(),
          originalPath: '/upload/test/IMG_123.jpg',
          type: AssetType.IMAGE,
          id: 'd587e44b-f8c0-4832-9ba3-43268bbf5d4e',
        } as StorageAsset,
        filename: 'IMG_123',
        extension: 'jpg',
        albumName: 'album',
      });
    } catch (error) {
      this.logger.warn(`Storage template validation failed: ${JSON.stringify(error)}`);
      throw new Error(`Invalid storage template: ${error}`);
    }
  }

  getStorageTemplateOptions(): SystemConfigTemplateStorageOptionDto {
    return { ...storageTokens, presetOptions: storagePresets };
  }

  @OnJob({ name: JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE, queue: QueueName.STORAGE_TEMPLATE_MIGRATION })
  async handleMigrationSingle({ id }: JobOf<JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE>): Promise<JobStatus> {
    const config = await this.getConfig({ withCache: true });
    const storageTemplateEnabled = config.storageTemplate.enabled;
    if (!storageTemplateEnabled) {
      return JobStatus.SKIPPED;
    }

    const asset = await this.assetRepository.getStorageTemplateAsset(id);
    if (!asset) {
      return JobStatus.FAILED;
    }

    const user = await this.userRepository.get(asset.ownerId, {});
    const storageLabel = user?.storageLabel || null;
    const filename = asset.originalFileName || asset.id;
    await this.moveAsset(asset, { storageLabel, filename });

    // move motion part of live photo
    if (asset.livePhotoVideoId) {
      const livePhotoVideo = await this.assetRepository.getStorageTemplateAsset(asset.livePhotoVideoId);
      if (!livePhotoVideo) {
        return JobStatus.FAILED;
      }
      const motionFilename = getLivePhotoMotionFilename(filename, livePhotoVideo.originalPath);
      await this.moveAsset(livePhotoVideo, { storageLabel, filename: motionFilename });
    }
    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.STORAGE_TEMPLATE_MIGRATION, queue: QueueName.STORAGE_TEMPLATE_MIGRATION })
  async handleMigration(): Promise<JobStatus> {
    this.logger.log('Starting storage template migration');
    const { storageTemplate } = await this.getConfig({ withCache: true });
    const { enabled } = storageTemplate;
    if (!enabled) {
      this.logger.log('Storage template migration disabled, skipping');
      return JobStatus.SKIPPED;
    }

    await this.moveRepository.cleanMoveHistory();

    const assets = this.assetRepository.streamStorageTemplateAssets();
    const users = await this.userRepository.getList();

    for await (const asset of assets) {
      const user = users.find((user) => user.id === asset.ownerId);
      const storageLabel = user?.storageLabel || null;
      const filename = asset.originalFileName || asset.id;
      await this.moveAsset(asset, { storageLabel, filename });
    }

    this.logger.debug('Cleaning up empty directories...');
    const libraryFolder = StorageCore.getBaseFolder(StorageFolder.LIBRARY);
    await this.storageRepository.removeEmptyDirs(libraryFolder);

    this.logger.log('Finished storage template migration');

    return JobStatus.SUCCESS;
  }

  @OnEvent({ name: 'asset.delete' })
  async handleMoveHistoryCleanup({ assetId }: ArgOf<'asset.delete'>) {
    this.logger.debug(`Cleaning up move history for asset ${assetId}`);
    await this.moveRepository.cleanMoveHistorySingle(assetId);
  }

  async moveAsset(asset: StorageAsset, metadata: MoveAssetMetadata) {
    if (asset.isExternal || StorageCore.isAndroidMotionPath(asset.originalPath)) {
      // External assets are not affected by storage template
      // TODO: shouldn't this only apply to external assets?
      return;
    }

    return this.databaseRepository.withLock(DatabaseLock.StorageTemplateMigration, async () => {
      const { id, sidecarPath, originalPath, checksum, fileSizeInByte } = asset;
      const oldPath = originalPath;
      const newPath = await this.getTemplatePath(asset, metadata);

      if (!fileSizeInByte) {
        this.logger.error(`Asset ${id} missing exif info, skipping storage template migration`);
        return;
      }

      try {
        await this.storageCore.moveFile({
          entityId: id,
          pathType: AssetPathType.ORIGINAL,
          oldPath,
          newPath,
          assetInfo: { sizeInBytes: fileSizeInByte, checksum },
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

  private async getTemplatePath(asset: StorageAsset, metadata: MoveAssetMetadata): Promise<string> {
    const { storageLabel, filename } = metadata;

    try {
      const source = asset.originalPath;
      let extension = path.extname(source).split('.').pop() as string;
      const sanitized = sanitize(path.basename(filename, `.${extension}`));
      extension = extension?.toLowerCase();
      const rootPath = StorageCore.getLibraryFolder({ id: asset.ownerId, storageLabel });

      switch (extension) {
        case 'jpeg':
        case 'jpe': {
          extension = 'jpg';
          break;
        }
        case 'tif': {
          extension = 'tiff';
          break;
        }
        case '3gpp': {
          extension = '3gp';
          break;
        }
        case 'mpeg':
        case 'mpe': {
          extension = 'mpg';
          break;
        }
        case 'm2ts':
        case 'm2t': {
          extension = 'mts';
          break;
        }
      }

      let albumName = null;
      if (this.template.needsAlbum) {
        const albums = await this.albumRepository.getByAssetId(asset.ownerId, asset.id);
        albumName = albums?.[0]?.albumName || null;
      }

      const storagePath = this.render(this.template.compiled, {
        asset,
        filename: sanitized,
        extension,
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
      assetIdShort: asset.id.slice(-12),
      //just throw into the root if it doesn't belong to an album
      album: (albumName && sanitize(albumName.replaceAll(/\.+/g, ''))) || '',
    };

    const systemTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const zone = asset.timeZone || systemTimeZone;
    const dt = DateTime.fromJSDate(asset.fileCreatedAt, { zone });

    for (const token of Object.values(storageTokens).flat()) {
      substitutions[token] = dt.toFormat(token);
    }

    return template(substitutions).replaceAll(/\/{2,}/gm, '/');
  }
}
