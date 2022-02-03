import { Module } from '@nestjs/common';
import { ServerInfoService } from './server-info.service';
import { ServerInfoController } from './server-info.controller';

@Module({
  controllers: [ServerInfoController],
  providers: [ServerInfoService]
})
export class ServerInfoModule {}
