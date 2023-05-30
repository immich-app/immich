import { AssetEntity, AssetType, SystemConfig } from '@app/infra/entities';
import { Logger } from '@nestjs/common';
import handlebar from 'handlebars';
import * as luxon from 'luxon';
import path from 'node:path';
import sanitize from 'sanitize-filename';
import { IStorageRepository, StorageCore } from '../storage';
import {
  ISystemConfigRepository,
  supportedDayTokens,
  supportedHourTokens,
  supportedMinuteTokens,
  supportedMonthTokens,
  supportedSecondTokens,
  supportedYearTokens,
} from '../system-config';
import { SystemConfigCore } from '../system-config/system-config.core';
import { MoveAssetMetadata } from './storage-template.service';

export class StorageTemplateCore {
  private logger = new Logger(StorageTemplateCore.name);
  private configCore: SystemConfigCore;
  private storageTemplate: HandlebarsTemplateDelegate<any>;
  private storageCore = new StorageCore();

  constructor(
    configRepository: ISystemConfigRepository,
    config: SystemConfig,
    private storageRepository: IStorageRepository,
  ) {
    this.storageTemplate = this.compile(config.storageTemplate.template);
    this.configCore = new SystemConfigCore(configRepository);
    this.configCore.addValidator((config) => this.validateConfig(config));
    this.configCore.config$.subscribe((config) => this.onConfig(config));
  }

  public async getTemplatePath(asset: AssetEntity, metadata: MoveAssetMetadata): Promise<string> {
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

  private validateConfig(config: SystemConfig) {
    this.validateStorageTemplate(config.storageTemplate.template);
  }

  private validateStorageTemplate(templateString: string) {
    try {
      const template = this.compile(templateString);
      // test render an asset
      this.render(
        template,
        {
          fileCreatedAt: new Date(),
          originalPath: '/upload/test/IMG_123.jpg',
          type: AssetType.IMAGE,
        } as AssetEntity,
        'IMG_123',
        'jpg',
      );
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

    const dt = luxon.DateTime.fromJSDate(asset.fileCreatedAt);

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
