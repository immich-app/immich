import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { AuthUserDto } from '../decorators/auth-user.decorator';

@Injectable()
export class RouteNotSharedGuard implements CanActivate {
  logger = new Logger(RouteNotSharedGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthUserDto;

    // Inverse logic - I know it is weird
    if (user.isPublicUser) {
      this.logger.warn(`Denied attempt to access non-shared route: ${request.path}`);
      return false;
    }

    return true;
  }
}
