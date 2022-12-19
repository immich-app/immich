import { APP_UPLOAD_LOCATION } from '@app/common';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { SystemConfig } from '@app/database/entities/system-config.entity';
import { ImmichConfigService, INITIAL_SYSTEM_CONFIG } from '@app/immich-config';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import fsPromise from 'fs/promises';
import handlebar from 'handlebars';
import * as luxon from 'luxon';
import mv from 'mv';
import { constants } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import sanitize from 'sanitize-filename';
import { Repository } from 'typeorm';
import {
  supportedDayTokens,
  supportedHourTokens,
  supportedMinuteTokens,
  supportedMonthTokens,
  supportedSecondTokens,
  supportedYearTokens,
} from './constants/supported-datetime-template';

const moveFile = promisify<string, string, mv.Options>(mv);

@Injectable()
export class StorageService {
  readonly logger = new Logger(StorageService.name);

  private storageTemplate: HandlebarsTemplateDelegate<any>;

  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
    private immichConfigService: ImmichConfigService,
    @Inject(INITIAL_SYSTEM_CONFIG) config: SystemConfig,
  ) {
    this.storageTemplate = this.compile(config.storageTemplate.template);

    this.immichConfigService.addValidator((config) => this.validateConfig(config));

    this.immichConfigService.config$.subscribe((config) => {
      this.logger.debug(`Received new config, recompiling storage template: ${config.storageTemplate.template}`);
      this.storageTemplate = this.compile(config.storageTemplate.template);
    });
  }

  public async moveAsset(asset: AssetEntity, filename: string): Promise<AssetEntity> {
    try {
      const source = asset.originalPath;
      const ext = path.extname(source).split('.').pop() as string;
      const sanitized = sanitize(path.basename(filename, `.${ext}`));
      const rootPath = path.join(APP_UPLOAD_LOCATION, asset.userId);
      const storagePath = this.render(this.storageTemplate, asset, sanitized, ext);
      const fullPath = path.normalize(path.join(rootPath, storagePath));

      if (!fullPath.startsWith(rootPath)) {
        this.logger.warn(`Skipped attempt to access an invalid path: ${fullPath}. Path should start with ${rootPath}`);
        return asset;
      }

      let duplicateCount = 0;
      let destination = `${fullPath}.${ext}`;

      while (true) {
        const exists = await this.checkFileExist(destination);
        if (!exists) {
          break;
        }

        duplicateCount++;
        destination = `${fullPath}_${duplicateCount}.${ext}`;
      }

      await this.safeMove(source, destination);

      asset.originalPath = destination;
      return await this.assetRepository.save(asset);
    } catch (error: any) {
      this.logger.error(error);
      return asset;
    }
  }

  private safeMove(source: string, destination: string): Promise<void> {
    return moveFile(source, destination, { mkdirp: true, clobber: false });
  }

  private async checkFileExist(path: string): Promise<boolean> {
    try {
      await fsPromise.access(path, constants.F_OK);
      return true;
    } catch (_) {
      return false;
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
          createdAt: new Date().toISOString(),
          originalPath: '/upload/test/IMG_123.jpg',
        } as AssetEntity,
        'IMG_123',
        'jpg',
      );
    } catch (e) {
      this.logger.warn(`Storage template validation failed: ${e}`);
      throw new Error(`Invalid storage template: ${e}`);
    }
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
    };

    const dt = luxon.DateTime.fromISO(new Date(asset.createdAt).toISOString());

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

  public async shouldMigrate(asset: AssetEntity, filename: string): Promise<boolean> {
    const source = path.normalize(asset.originalPath);
    const ext = path.extname(source).split('.').pop() as string;
    const sanitized = sanitize(path.basename(filename, `.${ext}`));
    const rootPath = path.join(APP_UPLOAD_LOCATION, asset.userId);
    const storagePath = this.render(this.storageTemplate, asset, sanitized, ext);
    const fullPath = path.normalize(path.join(rootPath, storagePath));
    const destination = `${fullPath}.${ext}`;

    return !(source === destination);
  }

  public async removeEmptyDirectories(directory: string) {
    // lstat does not follow symlinks (in contrast to stat)
    const fileStats = await fsPromise.lstat(directory);
    if (!fileStats.isDirectory()) {
      return;
    }
    let fileNames = await fsPromise.readdir(directory);
    if (fileNames.length > 0) {
      const recursiveRemovalPromises = fileNames.map((fileName) =>
        this.removeEmptyDirectories(path.join(directory, fileName)),
      );
      await Promise.all(recursiveRemovalPromises);

      // re-evaluate fileNames; after deleting subdirectory
      // we may have parent directory empty now
      fileNames = await fsPromise.readdir(directory);
    }

    if (fileNames.length === 0) {
      await fsPromise.rmdir(directory);
    }
  }
}
