import { IAssetRepository, IDeviceInfoRepository, ITagRepository, IUserRepository } from '@app/common';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config';
import { AssetEntity, DeviceInfoEntity, TagEntity, UserEntity } from './entities';
import { AssetRepository, DeviceInfoRepository, TagRepository, UserRepository } from './repositories';

const providers = [
  { provide: IAssetRepository, useClass: AssetRepository },
  { provide: IDeviceInfoRepository, useClass: DeviceInfoRepository },
  { provide: ITagRepository, useClass: TagRepository },
  { provide: IUserRepository, useClass: UserRepository },
];

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([AssetEntity, UserEntity, DeviceInfoEntity, TagEntity]),
  ],
  providers: [...providers],
  exports: [...providers],
})
export class DatabaseModule {}
