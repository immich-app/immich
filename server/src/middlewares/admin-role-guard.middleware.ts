import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../api-v1/user/entities/user.entity';
import * as util from "util";
import {ImmichJwtService} from "../modules/immich-auth/immich-jwt.service";

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(
      private reflector: Reflector,
      private immichJwtService: ImmichJwtService,
      @InjectRepository(UserEntity)
      private userRepository: Repository<UserEntity>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    console.log("AAA");
    console.log(util.inspect(request.user));

    if (request.headers['authorization']) {
      const bearerToken = request.headers['authorization'].split(" ")[1]
      const { userId } = await this.immichJwtService.validateToken(bearerToken);

      const user = await this.userRepository.findOne(userId);

      return user.isAdmin;
    }

    return false;
  }
}