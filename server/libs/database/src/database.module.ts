import { IAssetRepository, IDeviceInfoRepository } from '@app/common';
import { databaseConfig } from '@app/database';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity, DeviceInfoEntity, UserEntity } from './entities';
import { AssetRepository } from './repositories/asset.repository';
import { DeviceInfoRepository } from './repositories/device-info.repository';

const PROVIDERS = [
  { provide: IDeviceInfoRepository, useClass: DeviceInfoRepository },
  { provide: IAssetRepository, useClass: AssetRepository },
];

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([AssetEntity, UserEntity, DeviceInfoEntity]),
  ],
  providers: [...PROVIDERS],
  exports: [...PROVIDERS],
})
export class DatabaseModule {}
