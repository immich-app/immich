import { AssetEntity } from '@app/database/entities/asset.entity';
import { ImmichConfigModule, ImmichConfigService } from '@app/immich-config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageService } from './storage.service';
import { FileSystemStorageService } from './storage.service.filesystem';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity]), ImmichConfigModule, ImmichConfigModule],
  providers: [StorageService, ImmichConfigService, FileSystemStorageService],
  exports: [StorageService],
})
export class StorageModule {}
