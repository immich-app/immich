import { UserEntity } from '@app/database';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { jwtConfig } from '../../config/jwt.config';
import { ImmichJwtModule } from '../../modules/immich-jwt/immich-jwt.module';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { UserRepository, IUserRepository } from './user-repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';

const USER_REPOSITORY_PROVIDER = {
  provide: IUserRepository,
  useClass: UserRepository,
};

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), ImmichJwtModule, JwtModule.register(jwtConfig)],
  controllers: [UserController],
  providers: [UserService, ImmichJwtService, USER_REPOSITORY_PROVIDER],
  exports: [USER_REPOSITORY_PROVIDER],
})
export class UserModule {}
