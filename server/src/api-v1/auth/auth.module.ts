import {forwardRef, Module} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { ImmichJwtModule } from '../../modules/immich-jwt/immich-jwt.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';
import {HttpModule} from "@nestjs/axios";
import { JwtStrategy } from '../../modules/immich-jwt/strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { Oauth2Strategy } from '../../modules/immich-jwt/strategies/oauth.strategy';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), forwardRef(() => ImmichJwtModule), JwtModule.register(jwtConfig), HttpModule, PassportModule, ],
  controllers: [AuthController],
  providers: [AuthService, ImmichJwtService, JwtStrategy, Oauth2Strategy],
  exports: [AuthService],
})
export class AuthModule {}
