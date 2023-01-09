import { Module } from '@nestjs/common';
import { ImmichJwtService } from './immich-jwt.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@app/database';
import { APIKeyModule } from '../../api-v1/api-key/api-key.module';
import { APIKeyStrategy } from './strategies/api-key.strategy';
import { ShareModule } from '../../api-v1/share/share.module';
import { PublicShareStrategy } from './strategies/public-share.strategy';

@Module({
  imports: [JwtModule.register(jwtConfig), TypeOrmModule.forFeature([UserEntity]), APIKeyModule, ShareModule],
  providers: [ImmichJwtService, JwtStrategy, APIKeyStrategy, PublicShareStrategy],
  exports: [ImmichJwtService],
})
export class ImmichJwtModule {}
