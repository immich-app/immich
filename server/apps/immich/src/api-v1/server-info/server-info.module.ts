import { Module } from '@nestjs/common';
import { ServerInfoService } from './server-info.service';
import { ServerInfoController } from './server-info.controller';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImmichJwtModule } from '../../modules/immich-jwt/immich-jwt.module';
import { UserEntity } from '@app/database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity, UserEntity]), ImmichJwtModule],
  controllers: [ServerInfoController],
  providers: [ServerInfoService],
})
export class ServerInfoModule {}
