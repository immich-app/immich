import { Module } from '@nestjs/common';
import { ImmichJwtModule } from '../../modules/immich-jwt/immich-jwt.module';
import { OAuthModule } from '../oauth/oauth.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [ImmichJwtModule, OAuthModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
