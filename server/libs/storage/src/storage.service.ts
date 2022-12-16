import { AssetEntity } from '@app/database/entities/asset.entity';
import { ImmichConfigService } from '@app/immich-config';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileSystemStorageService } from './storage.service.filesystem';
import handlebar from 'handlebars';
import * as luxon from 'luxon';
import sanitize from 'sanitize-filename';
import path from 'node:path';

@Injectable()
export class StorageService {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    private fileSystemStorageService: FileSystemStorageService,

    private immichConfigService: ImmichConfigService,
  ) {}

  public async writeFile(asset: AssetEntity, filename: string) {
    const path = await this.buildPath(asset, filename);
    console.log('rebuild path: ', path);
    // If FileSystem storage enable -> Use FileSystemService
    // this.fileSystemStorageService.write();
  }

  private async buildPath(asset: AssetEntity, filename: string) {
    // Build path from user config
    // Get user config from database
    const configs = await this.immichConfigService.getConfig();

    try {
      const template = handlebar.compile(configs.storageTemplate.template, {
        knownHelpers: undefined,
      });
      const dt = luxon.DateTime.fromISO(new Date(asset.createdAt).toISOString());
      console.log('template: ', configs.storageTemplate.template);
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
        filename: sanitize(path.basename(filename, path.extname(filename))),
        ext: path.extname(filename).split('.').pop(),
      });
    } catch (error) {
      return 'error';
    }
  }
}
