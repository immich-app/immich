import { Module } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { CommunicationGateway } from './communication.gateway';
import { ImmichJwtModule } from '../../modules/immich-jwt/immich-jwt.module';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@app/database';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), ImmichJwtModule, JwtModule.register(jwtConfig)],
  providers: [CommunicationGateway, CommunicationService, ImmichJwtService],
  exports: [CommunicationGateway],
})
export class CommunicationModule {}
