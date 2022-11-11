import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  logger = new Logger(AdminRolesGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const isAdmin = request.user?.isAdmin || false;
    if (!isAdmin) {
      this.logger.log(`Denied access to admin only route: ${request.path}`);
      return false;
    }

    return true;
  }
}
