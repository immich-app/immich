import { APP_IMPORT_LOCATION } from '@app/common';
import { AssetType } from '@app/database/entities/asset.entity';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as chokidar from 'chokidar';
import { isUUID } from 'class-validator';
import { Response } from 'express';
import { Stats } from 'fs';
import * as mime from 'mime-types';
import path from 'path';
import { AssetService } from '../../api-v1/asset/asset.service';
import { CreateAssetDto } from '../../api-v1/asset/dto/create-asset.dto';
import { UserService } from '../../api-v1/user/user.service';
import { asHumanReadable } from '../../utils/human-readable.util';

@Injectable()
export class ImportTaskService {
  private enabled = false;
  private logger = new Logger(ImportTaskService.name);
  private watcher: chokidar.FSWatcher | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly assetService: AssetService,
    private readonly userService: UserService,
  ) {
    this.watch();
  }

  watch() {
    this.enabled = !!this.configService.get('IMPORT_LOCATION');
    if (!this.enabled) {
      return;
    }

    this.logger.log(`Starting file watcher`);

    this.watcher = chokidar
      .watch(APP_IMPORT_LOCATION, {
        awaitWriteFinish: true,
      })
      .on('add', (filepath: string, stats: Stats) => this.onNewFile(filepath, stats));
  }

  private async onNewFile(filepath: string, stats: Stats) {
    try {
      this.logger.debug(`Processing ${filepath} ${asHumanReadable(stats.size)}`);

      const userId = filepath.split(path.sep)[2];
      if (!userId) {
        this.logger.warn(`Skipped ${filepath}, due to: missing userId in filepath`);
        return;
      }

      if (!isUUID(userId)) {
        this.logger.warn(`Skipped ${filepath}, due to: userId is not a valid UUID`);
        return;
      }

      const user = await this.userService.getUserById(userId);
      if (!user) {
        this.logger.warn(`Skipped ${filepath}, due to: user not found`);
        return;
      }

      const createdAt = new Date(stats.ctimeMs).toISOString();
      const modifiedAt = new Date(stats.mtimeMs).toISOString();

      const filename = path.basename(filepath);
      const fileExtension = path.extname(filepath);

      const mimetype = mime.lookup(fileExtension);

      let assetType = AssetType.IMAGE;
      if (mimetype && mimetype.includes('video')) {
        assetType = AssetType.VIDEO;
      }

      const dto: CreateAssetDto = {
        deviceAssetId: `server-${filename}-${stats.mtimeMs}`,
        deviceId: 'server',
        assetType,
        createdAt,
        modifiedAt,
        isFavorite: false,
        fileExtension,
      };

      const file = {
        path: filepath,
        originalname: filename,
        filename: filename,
        mimetype,
      } as Express.Multer.File;

      // TODO: refactor asset service
      let duplicate = false;
      const res = {
        status: () => {
          duplicate = true;
        },
      } as unknown as Response;

      const { id: assetId } = await this.assetService.handleUploadedAsset(user, dto, res, file);

      if (duplicate) {
        this.logger.warn(`Skipped ${filepath}, due to: duplicate`);
        return;
      }

      this.logger.log(`Added ${filepath} => ${assetId}`);
    } catch (error) {
      this.logger.warn(`Skipped ${filepath}, due to processing error: ${error}`);
    }
  }

  async unwatch() {
    if (this.watcher) {
      await this.watcher.close();
    }
  }
}
