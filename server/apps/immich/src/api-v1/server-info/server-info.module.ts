import { Module } from '@nestjs/common';
import { ServerInfoService } from './server-info.service';
import { ServerInfoController } from './server-info.controller';
import { AssetEntity, UserEntity } from '@app/database';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImmichJwtModule } from '../../modules/immich-jwt/immich-jwt.module';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity, UserEntity]), ImmichJwtModule],
  controllers: [ServerInfoController],
  providers: [ServerInfoService],
})
export class ServerInfoModule {}
