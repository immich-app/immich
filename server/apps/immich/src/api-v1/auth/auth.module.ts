import { UserEntity } from '@app/database/entities/user.entity';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { jwtConfig } from '../../config/jwt.config';
import { ImmichJwtModule } from '../../modules/immich-jwt/immich-jwt.module';
import { OAuthModule } from '../oauth/oauth.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UserModule,
    ImmichJwtModule,
    OAuthModule,
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.register(jwtConfig),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
