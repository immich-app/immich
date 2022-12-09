import { Module } from '@nestjs/common';
import { DeviceInfoController } from './device-info/device-info.controller';
import { ServerInfoController } from './server-info/server-info.controller';
import { TagController } from './tag/tag.controller';

@Module({
  controllers: [DeviceInfoController, TagController, ServerInfoController],
})
export class APIv1Module {}
