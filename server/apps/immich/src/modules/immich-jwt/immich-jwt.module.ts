import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';
import { ImmichJwtService } from './immich-jwt.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [JwtModule.register(jwtConfig)],
  providers: [ImmichJwtService, JwtStrategy],
  exports: [JwtModule, ImmichJwtService],
})
export class ImmichJwtModule {}
