import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '@app/database/entities/user.entity';
import { ImmichJwtService } from '../modules/immich-jwt/immich-jwt.service';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: ImmichJwtService,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (request.headers['authorization']) {
      const bearerToken = request.headers['authorization'].split(' ')[1];
      const { userId } = await this.jwtService.validateToken(bearerToken);

      const user = await this.userRepository.findOne(userId);

      return user.isAdmin;
    }

    return false;
  }
}
