import { AuthService, AuthUserDto, IMMICH_API_KEY_NAME, LoginDetails } from '@app/domain';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  SetMetadata,
  applyDecorators,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiBearerAuth, ApiCookieAuth, ApiQuery, ApiSecurity } from '@nestjs/swagger';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';

export enum Metadata {
  AUTH_ROUTE = 'auth_route',
  ADMIN_ROUTE = 'admin_route',
  SHARED_ROUTE = 'shared_route',
  PUBLIC_SECURITY = 'public_security',
}

const adminDecorator = SetMetadata(Metadata.ADMIN_ROUTE, true);

const sharedLinkDecorators = [
  SetMetadata(Metadata.SHARED_ROUTE, true),
  ApiQuery({ name: 'key', type: String, required: false }),
];

export interface AuthenticatedOptions {
  admin?: boolean;
  isShared?: boolean;
}

export const Authenticated = (options: AuthenticatedOptions = {}) => {
  const decorators: MethodDecorator[] = [
    ApiBearerAuth(),
    ApiCookieAuth(),
    ApiSecurity(IMMICH_API_KEY_NAME),
    SetMetadata(Metadata.AUTH_ROUTE, true),
  ];

  if (options.admin) {
    decorators.push(adminDecorator);
  }

  if (options.isShared) {
    decorators.push(...sharedLinkDecorators);
  }

  return applyDecorators(...decorators);
};

export const PublicRoute = () =>
  applyDecorators(SetMetadata(Metadata.AUTH_ROUTE, false), ApiSecurity(Metadata.PUBLIC_SECURITY));
export const SharedLinkRoute = () => applyDecorators(...sharedLinkDecorators);
export const AdminRoute = () => adminDecorator;

export const AuthUser = createParamDecorator((data, ctx: ExecutionContext): AuthUserDto => {
  return ctx.switchToHttp().getRequest<{ user: AuthUserDto }>().user;
});

export const GetLoginDetails = createParamDecorator((data, ctx: ExecutionContext): LoginDetails => {
  const req = ctx.switchToHttp().getRequest<Request>();
  const userAgent = UAParser(req.headers['user-agent']);

  return {
    clientIp: req.ip,
    isSecure: req.secure,
    deviceType: userAgent.browser.name || userAgent.device.type || (req.headers.devicemodel as string) || '',
    deviceOS: userAgent.os.name || (req.headers.devicetype as string) || '',
  };
});

export interface AuthRequest extends Request {
  user?: AuthUserDto;
}

@Injectable()
export class AppGuard implements CanActivate {
  private logger = new Logger(AppGuard.name);

  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

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
