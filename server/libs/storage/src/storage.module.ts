import { AssetEntity } from '@app/database/entities/asset.entity';
import { ImmichConfigModule } from '@app/immich-config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfigModule } from 'apps/immich/src/api-v1/system-config/system-config.module';
import { SystemConfigService } from 'apps/immich/src/api-v1/system-config/system-config.service';
import { StorageService } from './storage.service';
import { FileSystemStorageService } from './storage.service.filesystem';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity]), SystemConfigModule, ImmichConfigModule],
  providers: [StorageService, SystemConfigService, FileSystemStorageService],
  exports: [StorageService],
})
export class StorageModule {}
