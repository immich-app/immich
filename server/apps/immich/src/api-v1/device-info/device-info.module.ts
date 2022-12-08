import { Module } from '@nestjs/common';
import { DeviceInfoController } from './device-info.controller';

@Module({
  controllers: [DeviceInfoController],
})
export class DeviceInfoModule {}
