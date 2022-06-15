import { Module } from '@nestjs/common';
import { ImmichJwtService } from './immich-jwt.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import {UserEntity} from "@app/database/entities/user.entity";
import {ImmichOauth2Service} from "./immich-oauth2.service";
import {Oauth2Strategy} from "./strategies/oauth.strategy";
import { ImmichAuthService } from './immich-auth.service';
import {ConfigModule} from "@nestjs/config";

@Module({
  imports: [JwtModule.register(jwtConfig), TypeOrmModule.forFeature([UserEntity]), ConfigModule],
  providers: [ImmichJwtService, ImmichOauth2Service, ImmichAuthService, JwtStrategy, Oauth2Strategy],
  exports: [ImmichJwtService, ImmichOauth2Service, ImmichAuthService],
})
export class ImmichAuthModule {}