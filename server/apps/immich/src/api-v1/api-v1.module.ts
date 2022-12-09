import { Module } from '@nestjs/common';
import { DeviceInfoController } from './device-info/device-info.controller';
import { ServerInfoController } from './server-info/server-info.controller';

@Module({
  controllers: [DeviceInfoController, ServerInfoController],
})
export class APIv1Module {}
