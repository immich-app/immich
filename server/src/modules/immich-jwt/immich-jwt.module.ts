import {forwardRef, Module} from '@nestjs/common';
import { ImmichJwtService } from './immich-jwt.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../api-v1/user/entities/user.entity';
import {AuthModule} from "../../api-v1/auth/auth.module";
import { Oauth2Strategy } from './strategies/oauth.strategy';

@Module({
  imports: [forwardRef(() => AuthModule), JwtModule.register(jwtConfig), TypeOrmModule.forFeature([UserEntity])],
  providers: [ImmichJwtService, JwtStrategy, Oauth2Strategy],
  exports: [ImmichJwtService],
})
export class ImmichJwtModule {}
