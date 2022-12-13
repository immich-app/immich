import { AssetEntity } from '@app/database/entities/asset.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SystemConfigService } from 'apps/immich/src/api-v1/system-config/system-config.service';
import { Repository } from 'typeorm';
import { FileSystemStorageService } from './storage.service.filesystem';
import { S3StorageService } from './storage.service.s3';

@Injectable()
export class StorageService {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
    private systemConfig: SystemConfigService,

    private fileSystemStorageService: FileSystemStorageService,
    private s3StorageService: S3StorageService,
  ) {}

  public async buildOriginalFile(asset: AssetEntity, filename: string) {
    // Get user config from database
    const configs = await this.systemConfig.getConfig();

    // If S3 storage enable -> Use S3Service
    // this.s3StorageService.write();

    // If FileSystem storage enable -> Use FileSystemService
    // this.fileSystemStorageService.write();
  }
}
