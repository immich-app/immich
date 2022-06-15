import { Module } from '@nestjs/common';
import { DeviceInfoService } from './device-info.service';
import { DeviceInfoController } from './device-info.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceInfoEntity } from '@app/database/entities/device-info.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceInfoEntity])],
  controllers: [DeviceInfoController],
  providers: [DeviceInfoService],
})
export class DeviceInfoModule {}
