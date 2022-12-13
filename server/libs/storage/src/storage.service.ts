import { AssetEntity } from '@app/database/entities/asset.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SystemConfigService } from 'apps/immich/src/api-v1/system-config/system-config.service';
import { Repository } from 'typeorm';
import { FileSystemStorageService } from './storage.service.filesystem';

@Injectable()
export class StorageService {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
    private systemConfig: SystemConfigService,

    private fileSystemStorageService: FileSystemStorageService,
  ) {}

  public async writeFile(asset: AssetEntity, filename: string) {
    const path = this.buildPath(asset, filename);
    // If FileSystem storage enable -> Use FileSystemService
    // this.fileSystemStorageService.write();
  }

  private async buildPath(asset: AssetEntity, filename: string) {
    // Build path from user config
    // Get user config from database
    const configs = await this.systemConfig.getConfig();

    return '';
  }
}
