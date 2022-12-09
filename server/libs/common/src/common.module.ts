import { Global, Module } from '@nestjs/common';
import { DeviceInfoService, ServerInfoService, TagService, UserService } from './services';

const providers = [DeviceInfoService, ServerInfoService, TagService, UserService];

@Global()
@Module({
  providers: [...providers],
  exports: [...providers],
})
export class CommonModule {}
