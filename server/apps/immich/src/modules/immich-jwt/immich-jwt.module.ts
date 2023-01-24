import { Module } from '@nestjs/common';
import { ShareModule } from '../../api-v1/share/share.module';
import { APIKeyStrategy } from './strategies/api-key.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PublicShareStrategy } from './strategies/public-share.strategy';

@Module({
  imports: [ShareModule],
  providers: [JwtStrategy, APIKeyStrategy, PublicShareStrategy],
})
export class ImmichJwtModule {}
