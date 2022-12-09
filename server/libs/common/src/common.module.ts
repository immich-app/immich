import { Global, Module } from '@nestjs/common';
import { DeviceInfoService, ServerInfoService, TagService } from './services';

const providers = [DeviceInfoService, ServerInfoService, TagService];

@Global()
@Module({
  providers: [...providers],
  exports: [...providers],
})
export class CommonModule {}
