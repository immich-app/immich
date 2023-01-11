import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { UserResponseDto } from '@app/domain';

interface UserRequest extends Request {
  user: UserResponseDto;
}

@Injectable()
export class AdminRolesGuard implements CanActivate {
  logger = new Logger(AdminRolesGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<UserRequest>();
    const isAdmin = request.user?.isAdmin || false;
    if (!isAdmin) {
      this.logger.log(`Denied access to admin only route: ${request.path}`);
      return false;
    }

    return true;
  }
}
