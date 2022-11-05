import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { ImmichJwtModule } from '../../modules/immich-jwt/immich-jwt.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';
import { SystemConfigService } from '@app/system-config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfigEntity } from '@app/database/entities/system-config.entity';
import { UserEntity } from '@app/database/entities/user.entity';

@Module({
  imports: [ImmichJwtModule, JwtModule.register(jwtConfig), TypeOrmModule.forFeature([SystemConfigEntity, UserEntity])],
  controllers: [ConfigController],
  providers: [ConfigService, SystemConfigService, ImmichJwtService],
})
export class ConfigModule {}
