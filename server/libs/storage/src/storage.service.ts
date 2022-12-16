import { APP_UPLOAD_LOCATION } from '@app/common';
import { AssetEntity } from '@app/database/entities/asset.entity';
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
import { SystemConfig } from '@app/database/entities/system-config.entity';
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
  readonly log = new Logger(StorageService.name);

  private storageTemplate: HandlebarsTemplateDelegate<any>;

  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
    private immichConfigService: ImmichConfigService,
    @Inject(INITIAL_SYSTEM_CONFIG) config: SystemConfig,
  ) {
    // initial config
    this.storageTemplate = this.makeStorageTemplate(config);

    // subscribe to changes
    this.immichConfigService.config$.subscribe((config) => {
      this.log.debug(`Received new config, recompiling storage template: ${config.storageTemplate.template}`);
      this.storageTemplate = this.makeStorageTemplate(config);
    });
  }

  public async moveAsset(asset: AssetEntity, filename: string): Promise<AssetEntity> {
    try {
      const source = asset.originalPath;
      const ext = path.extname(source).split('.').pop() as string;
      const sanitized = sanitize(path.basename(filename, ext));
      const storagePath = await this.renderStorageTemplate(asset, sanitized, ext);
      const fullPath = path.normalize(path.join(APP_UPLOAD_LOCATION, asset.userId, storagePath));

      // TODO: parent directory check

      let duplicateCount = 0;
      let destination = `${fullPath}.${ext}`;

      while (true) {
        // some sanity to prevent infinite loop?
        // if (duplicateCount > threshold) {
        //   throw new InternalServerErrorException(`Unable to find unique filename!`);
        // }

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
      this.log.error(error, error.stack);
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

  private makeStorageTemplate(config: SystemConfig) {
    return handlebar.compile(config.storageTemplate.template, {
      knownHelpers: undefined,
      strict: true,
    });
  }

  private async renderStorageTemplate(asset: AssetEntity, filename: string, ext: string) {
    try {
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

      return this.storageTemplate(substitutions);
    } catch (error: any) {
      this.log.error(error, error.stack);
      return asset.originalPath;
    }
  }
}
