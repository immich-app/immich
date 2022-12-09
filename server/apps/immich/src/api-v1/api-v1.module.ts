import { Module } from '@nestjs/common';
import { ImmichJwtModule } from '../modules/immich-jwt/immich-jwt.module';
import { DeviceInfoController } from './device-info/device-info.controller';
import { ServerInfoController } from './server-info/server-info.controller';
import { TagController } from './tag/tag.controller';
import { UserController } from './user/user.controller';

@Module({
  imports: [ImmichJwtModule],
  controllers: [DeviceInfoController, TagController, ServerInfoController, UserController],
})
export class APIv1Module {}
