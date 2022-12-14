import { AssetEntity } from '@app/database/entities/asset.entity';
import { SystemConfigEntity } from '@app/database/entities/system-config.entity';
import { ImmichConfigModule } from '@app/immich-config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageService } from './storage.service';
import { FileSystemStorageService } from './storage.service.filesystem';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity, SystemConfigEntity]), ImmichConfigModule],
  providers: [StorageService, FileSystemStorageService],
  exports: [StorageService],
})
export class StorageModule {}
