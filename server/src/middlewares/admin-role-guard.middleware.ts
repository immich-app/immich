import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserEntity } from '../api-v1/user/entities/user.entity';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    console.log(request.headers, request.user)
    // const { isAdmin } = request.user as UserEntity;;

    // if (!isAdmin) return false;

    return true
  }
}