import { AssetEntity } from '@app/database/entities/asset.entity';
import { SystemConfigEntity } from '@app/database/entities/system-config.entity';
import { ImmichConfigModule } from '@app/immich-config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageService } from './storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity, SystemConfigEntity]), ImmichConfigModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
