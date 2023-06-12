import { AuthService } from '@app/domain';
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthRequest } from '../decorators/auth-user.decorator';
import { Metadata } from '../decorators/authenticated.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  private logger = new Logger(AuthGuard.name);

  constructor(private reflector: Reflector, private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];

    const isAuthRoute = this.reflector.getAllAndOverride(Metadata.AUTH_ROUTE, targets);
    const isAdminRoute = this.reflector.getAllAndOverride(Metadata.ADMIN_ROUTE, targets);
    const isSharedRoute = this.reflector.getAllAndOverride(Metadata.SHARED_ROUTE, targets);

    if (!isAuthRoute) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthRequest>();

    const authDto = await this.authService.validate(req.headers, req.query as Record<string, string>);
    if (!authDto) {
      this.logger.warn(`Denied access to authenticated route: ${req.path}`);
      return false;
    }

    if (authDto.isPublicUser && !isSharedRoute) {
      this.logger.warn(`Denied access to non-shared route: ${req.path}`);
      return false;
    }

    if (isAdminRoute && !authDto.isAdmin) {
      this.logger.warn(`Denied access to admin only route: ${req.path}`);
      return false;
    }

    req.user = authDto;

    return true;
  }
}
