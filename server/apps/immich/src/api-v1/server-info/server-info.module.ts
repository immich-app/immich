import { Module } from '@nestjs/common';
import { ServerInfoService } from './server-info.service';
import { ServerInfoController } from './server-info.controller';
import { AssetEntity } from '@app/infra';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity])],
  controllers: [ServerInfoController],
  providers: [ServerInfoService],
})
export class ServerInfoModule {}
