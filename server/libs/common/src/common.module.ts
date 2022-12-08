import { Global, Module } from '@nestjs/common';
import { DeviceInfoService } from './services';

const providers = [DeviceInfoService];

@Global()
@Module({
  providers: [...providers],
  exports: [...providers],
})
export class CommonModule {}
