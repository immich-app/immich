import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { PublicUser } from '../modules/immich-jwt/strategies/public-share.strategy';

@Injectable()
export class RouteNotSharedGuard implements CanActivate {
  logger = new Logger(RouteNotSharedGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as PublicUser;

    // Inverse logic - I know it is weird
    if (user.isPublicUser) {
      this.logger.warn(`Denied attempt to access non-shared route: ${request.path}`);
      return false;
    }

    return true;
  }
}
