import { CanActivate, ExecutionContext, Injectable, UseGuards } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    return request.user?.isAdmin || false;
  }
}

export const Admin = () => UseGuards(AdminRolesGuard);
