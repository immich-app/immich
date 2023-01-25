import { Module } from '@nestjs/common';
import { APIKeyStrategy } from './strategies/api-key.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PublicShareStrategy } from './strategies/public-share.strategy';

@Module({
  providers: [JwtStrategy, APIKeyStrategy, PublicShareStrategy],
})
export class ImmichJwtModule {}
