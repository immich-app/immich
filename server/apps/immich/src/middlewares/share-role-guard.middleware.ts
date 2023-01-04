import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { PublicUser } from '../modules/immich-jwt/strategies/public-share.strategy';

@Injectable()
export class ShareRoleGuard implements CanActivate {
  logger = new Logger(ShareRoleGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('ShareRoleGuard canActivate triggred');
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as PublicUser;

    if (!user.isPublicUser) {
      this.logger.log(`Denied access to shared link route: ${request.path}`);
      return false;
    }

    return true;
  }
}
