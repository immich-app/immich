import { Module } from '@nestjs/common';
import { ImmichJwtService } from './immich-jwt.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { APIKeyStrategy } from './strategies/api-key.strategy';
import { PublicShareStrategy } from './strategies/public-share.strategy';

@Module({
  imports: [JwtModule.register(jwtConfig)],
  providers: [ImmichJwtService, JwtStrategy, APIKeyStrategy, PublicShareStrategy],
  exports: [ImmichJwtService],
})
export class ImmichJwtModule {}
