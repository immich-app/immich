import { APP_UPLOAD_LOCATION } from '@app/common';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { ImmichConfigService } from '@app/immich-config';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import handlebar from 'handlebars';
import * as luxon from 'luxon';
import sanitize from 'sanitize-filename';
import path from 'node:path';
import { constants } from 'node:fs';
import fsPromise from 'fs/promises';
import mv from 'mv';

@Injectable()
export class StorageService {
  readonly log = new Logger(StorageService.name);

  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
    private immichConfigService: ImmichConfigService,
  ) {}

  public async moveFile(asset: AssetEntity, filename: string): Promise<AssetEntity> {
    try {
      const parsedPath = await this.buildPath(asset, filename);
      const fileExtension = path.extname(asset.originalPath).split('.').pop() as string;
      let qualifiedPath = path.join(APP_UPLOAD_LOCATION, asset.userId, parsedPath + '.' + fileExtension);

      let duplicateCount = 1;
      this.log.debug(`Checking if file exists: ${qualifiedPath}`);
      while (await this.checkFileExist(qualifiedPath)) {
        const newPath = await this.buildPath(asset, filename + `_${duplicateCount}`);
        qualifiedPath = path.join(APP_UPLOAD_LOCATION, asset.userId, newPath + '.' + fileExtension);
        duplicateCount++;
      }

      const destination = await this.moveAndDeleteFile(asset.originalPath, qualifiedPath);

      asset.originalPath = destination;
      return await this.assetRepository.save(asset);
    } catch (error: any) {
      this.log.error(error, error.stack);
      return asset;
    }
  }

  private moveAndDeleteFile(original: string, destination: string): Promise<string> {
    return new Promise((resolve, reject) => {
      mv(original, destination, { mkdirp: true, clobber: false }, (err) => {
        if (err) reject(err);
        resolve(destination);
      });
    });
  }

  private async checkFileExist(path: string): Promise<boolean> {
    try {
      await fsPromise.access(path, constants.F_OK);
      return true;
    } catch (_) {
      return false;
    }
  }

  private async buildPath(asset: AssetEntity, filename: string) {
    const configs = await this.immichConfigService.getConfig();

    try {
      const template = handlebar.compile(configs.storageTemplate.template, {
        knownHelpers: undefined,
      });

      const dt = luxon.DateTime.fromISO(new Date(asset.createdAt).toISOString());
      const sanitizedFilename = sanitize(path.basename(filename, path.extname(filename)));

      return template({
        y: dt.toFormat('y'),
        yy: dt.toFormat('yy'),
        M: dt.toFormat('M'),
        MM: dt.toFormat('MM'),
        MMM: dt.toFormat('MMM'),
        MMMM: dt.toFormat('MMMM'),
        d: dt.toFormat('d'),
        dd: dt.toFormat('dd'),
        h: dt.toFormat('h'),
        hh: dt.toFormat('hh'),
        H: dt.toFormat('H'),
        HH: dt.toFormat('HH'),
        m: dt.toFormat('m'),
        mm: dt.toFormat('mm'),
        s: dt.toFormat('s'),
        ss: dt.toFormat('ss'),
        filename: sanitizedFilename,
      });
    } catch (error: any) {
      this.log.error(error, error.stack);
      return asset.originalPath;
    }
  }
}
