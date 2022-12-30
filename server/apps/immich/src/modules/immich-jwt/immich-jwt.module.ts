import { Module } from '@nestjs/common';
import { ImmichJwtService } from './immich-jwt.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@app/database';

@Module({
  imports: [JwtModule.register(jwtConfig), TypeOrmModule.forFeature([UserEntity])],
  providers: [ImmichJwtService, JwtStrategy],
  exports: [ImmichJwtService],
})
export class ImmichJwtModule {}
