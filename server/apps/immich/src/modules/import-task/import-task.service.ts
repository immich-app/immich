import { APP_IMPORT_LOCATION } from '@app/common';
import { IUserRepository, UserCore } from '@app/domain';
import { AssetType } from '@app/infra';
import { StorageService } from '@app/storage';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as chokidar from 'chokidar';
import { isUUID } from 'class-validator';
import { Response } from 'express';
import { Stats } from 'fs';
import * as mime from 'mime-types';
import path from 'path';
import { AssetService } from '../../api-v1/asset/asset.service';
import { CreateAssetDto } from '../../api-v1/asset/dto/create-asset.dto';
import { asHumanReadable } from '../../utils/human-readable.util';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), ms));

const COOL_OFF_DURATION = 30_000;

enum StatType {
  IGNORED = 'ignored',
  INVALID = 'invalid',
  DUPLICATE = 'duplicate',
  IMPORTED = 'imported',
  FAILED = 'failed',
}

type ImportStats = Record<StatType, number>;

@Injectable()
export class ImportTaskService {
  private enabled = false;
  private logger = new Logger(ImportTaskService.name);
  private watcher: chokidar.FSWatcher | null = null;
  private userCore: UserCore;

  private timer: NodeJS.Timeout | null = null;

  private isCleaning = false;
  private addedAt = new Date().getTime();
  private unlinkedAt = new Date().getTime();
  private cleanedAt = new Date().getTime();
  private trackedAt = new Date().getTime();

  private stats: ImportStats = {
    [StatType.IGNORED]: 0,
    [StatType.INVALID]: 0,
    [StatType.IMPORTED]: 0,
    [StatType.DUPLICATE]: 0,
    [StatType.FAILED]: 0,
  };

  constructor(
    private configService: ConfigService,
    private assetService: AssetService,
    private storageService: StorageService,
    @Inject(IUserRepository) userRepository: IUserRepository,
  ) {
    this.userCore = new UserCore(userRepository);
  }

  async start() {
    if (this.watcher) {
      return;
    }

    this.enabled = !!this.configService.get('IMPORT_LOCATION');
    if (!this.enabled) {
      this.logger.log(`File watching is disabled (no IMPORT_LOCATION)`);
      return;
    }

    const admin = await this.userCore.getAdmin();
    if (!admin) {
      this.logger.warn(`File watching is disabled (new install with no users)`);
      return;
    }

    this.logger.log(`Starting file watcher in ${Math.floor(COOL_OFF_DURATION / 1000)} seconds`);

    await sleep(COOL_OFF_DURATION);

    this.logger.log(`Starting file watcher`);

    this.timer = setInterval(() => this.onTick(), 15_000);

    this.watcher = chokidar
      .watch(APP_IMPORT_LOCATION, {
        awaitWriteFinish: true,
      })
      .on('add', (filepath: string, stats: Stats) => this.onAddFile(filepath, stats))
      .on('unlink', () => this.onUnlinkFile());
  }

  private async onAddFile(filepath: string, stats: Stats) {
    // allow keeping userId directories
    if (filepath.endsWith('.immich-keep')) {
      this.track(StatType.IGNORED);
      return;
    }

    this.addedAt = new Date().getTime();

    try {
      this.logger.verbose(`Processing ${filepath} ${asHumanReadable(stats.size)}`);

      const userId = filepath.split(path.sep)[2];
      const user = userId && isUUID(userId) && (await this.userCore.get(userId));
      if (!user) {
        this.track(StatType.INVALID);
        this.logger.warn(`Skipped ${filepath} (invalid/missing userId in filepath)`);
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
          // what a work around!
          duplicate = true;
        },
      } as unknown as Response;

      const { id: assetId } = await this.assetService.handleUploadedAsset(user, dto, res, file);

      if (duplicate) {
        this.track(StatType.DUPLICATE);
        this.logger.warn(`Removed ${filepath} (duplicate)`);
        return;
      }

      this.track(StatType.IMPORTED);
      this.logger.debug(`Imported ${filepath} => ${assetId}`);
    } catch (error: any) {
      this.track(StatType.FAILED);
      this.logger.error(`Skipped ${filepath} (processing error: ${error})`);
      this.logger.error(error, error?.stack);
    }
  }

  private onUnlinkFile() {
    this.unlinkedAt = new Date().getTime();
  }

  async unwatch() {
    if (this.watcher) {
      await this.watcher.close();
    }

    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async restart() {
    await this.unwatch();
    await this.start();
  }

  private async onTick() {
    const now = new Date().getTime();

    const hasTracked = this.trackedAt > now - 30_000;
    if (hasTracked) {
      const { ignored, imported, invalid, duplicate, failed } = this.stats;
      this.logger.log(
        `[Stats] imported ${imported}, ignored ${ignored}, skipped ${invalid}, failed ${failed}, removed ${duplicate}`,
      );
    }

    const hasUnlinked = this.unlinkedAt > this.cleanedAt;
    const hasCooledOff = this.unlinkedAt + COOL_OFF_DURATION < now && this.addedAt + COOL_OFF_DURATION < now;

    if (!this.isCleaning && hasUnlinked && hasCooledOff) {
      this.cleanedAt = new Date().getTime();

      try {
        this.isCleaning = true;
        await this.storageService.removeEmptyDirectories(APP_IMPORT_LOCATION);
      } catch (error: any) {
        // fails trying to remove "/upload"
      } finally {
        this.isCleaning = false;
      }
    }
  }

  private track(type: StatType) {
    this.trackedAt = new Date().getTime();
    this.stats[type] += 1;
  }
}
