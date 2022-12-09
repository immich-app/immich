import { IAssetRepository, IDeviceInfoRepository, ITagRepository } from '@app/common';
import { databaseConfig } from '@app/database';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity, DeviceInfoEntity, TagEntity, UserEntity } from './entities';
import { AssetRepository } from './repositories/asset.repository';
import { DeviceInfoRepository } from './repositories/device-info.repository';
import { TagRepository } from './repositories/tag.repository';

const PROVIDERS = [
  { provide: IAssetRepository, useClass: AssetRepository },
  { provide: IDeviceInfoRepository, useClass: DeviceInfoRepository },
  { provide: ITagRepository, useClass: TagRepository },
];

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([AssetEntity, UserEntity, DeviceInfoEntity, TagEntity]),
  ],
  providers: [...PROVIDERS],
  exports: [...PROVIDERS],
})
export class DatabaseModule {}
