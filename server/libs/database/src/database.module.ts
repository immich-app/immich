import { IDeviceInfoRepository } from '@app/common';
import { databaseConfig } from '@app/database';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceInfoEntity } from './entities';
import { DeviceInfoRepository } from './repositories/device-info.repository';

const PROVIDERS = [{ provide: IDeviceInfoRepository, useClass: DeviceInfoRepository }];

@Global()
@Module({
  imports: [TypeOrmModule.forRoot(databaseConfig), TypeOrmModule.forFeature([DeviceInfoEntity])],
  providers: [...PROVIDERS],
  exports: [...PROVIDERS],
})
export class DatabaseModule {}
