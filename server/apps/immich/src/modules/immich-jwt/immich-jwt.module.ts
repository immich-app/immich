import { Module } from '@nestjs/common';
import { ImmichJwtService } from './immich-jwt.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [JwtModule.register(jwtConfig)],
  providers: [ImmichJwtService, JwtStrategy],
  exports: [ImmichJwtService],
})
export class ImmichJwtModule {}
