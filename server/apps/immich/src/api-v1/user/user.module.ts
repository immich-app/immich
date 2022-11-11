import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@app/database/entities/user.entity';
import { ImmichJwtModule } from '../../modules/immich-jwt/immich-jwt.module';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';
import { UserRepository, USER_REPOSITORY } from './user-repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), ImmichJwtModule, JwtModule.register(jwtConfig)],
  controllers: [UserController],
  providers: [
    UserService,
    ImmichJwtService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
})
export class UserModule {}
