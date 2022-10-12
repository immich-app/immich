import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { ImmichJwtModule } from '../../modules/immich-jwt/immich-jwt.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';
import { AdminConfigService } from '@app/admin-config'
import {TypeOrmModule} from "@nestjs/typeorm";
import {AdminConfigEntity} from "@app/database/entities/admin-config.entity";
import {UserEntity} from "@app/database/entities/user.entity";

@Module({
  imports: [
    ImmichJwtModule,
    JwtModule.register(jwtConfig),
    TypeOrmModule.forFeature([AdminConfigEntity, UserEntity])
  ],
  controllers: [ConfigController],
  providers: [
    ConfigService,
    AdminConfigService,
    ImmichJwtService,
  ],
})
export class ConfigModule {}
