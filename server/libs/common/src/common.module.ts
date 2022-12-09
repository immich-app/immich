import { Global, Module } from '@nestjs/common';
import { DeviceInfoService, ServerInfoService } from './services';

const providers = [DeviceInfoService, ServerInfoService];

@Global()
@Module({
  providers: [...providers],
  exports: [...providers],
})
export class CommonModule {}
