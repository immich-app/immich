import { UserEntity } from '@app/database/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImmichJwtModule } from '../../modules/immich-jwt/immich-jwt.module';
import { UserModule } from '../user/user.module';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';

@Module({
  imports: [UserModule, ImmichJwtModule, TypeOrmModule.forFeature([UserEntity])],
  controllers: [OAuthController],
  providers: [OAuthService],
  exports: [OAuthService],
})
export class OAuthModule {}
