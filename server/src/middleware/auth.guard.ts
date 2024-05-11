import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  SetMetadata,
  applyDecorators,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiBearerAuth, ApiCookieAuth, ApiOkResponse, ApiQuery, ApiSecurity } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthDto, ImmichQuery } from 'src/dtos/auth.dto';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { AuthService, LoginDetails } from 'src/services/auth.service';
import { UAParser } from 'ua-parser-js';

export enum Metadata {
  AUTH_ROUTE = 'auth_route',
  ADMIN_ROUTE = 'admin_route',
  SHARED_ROUTE = 'shared_route',
  API_KEY_SECURITY = 'api_key',
}

type AdminRoute = { admin?: true };
type SharedLinkRoute = { sharedLink?: true };
type AuthenticatedOptions = AdminRoute | SharedLinkRoute;

export const Authenticated = (options?: AuthenticatedOptions): MethodDecorator => {
  const decorators: MethodDecorator[] = [
    ApiBearerAuth(),
    ApiCookieAuth(),
    ApiSecurity(Metadata.API_KEY_SECURITY),
    SetMetadata(Metadata.AUTH_ROUTE, options || {}),
  ];

  if ((options as SharedLinkRoute)?.sharedLink) {
    decorators.push(ApiQuery({ name: ImmichQuery.SHARED_LINK_KEY, type: String, required: false }));
  }

  return applyDecorators(...decorators);
};

export const Auth = createParamDecorator((data, context: ExecutionContext): AuthDto => {
  return context.switchToHttp().getRequest<AuthenticatedRequest>().user;
});

export const FileResponse = () =>
  ApiOkResponse({
    content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } },
  });

export const GetLoginDetails = createParamDecorator((data, context: ExecutionContext): LoginDetails => {
  const request = context.switchToHttp().getRequest<Request>();
  const userAgent = UAParser(request.headers['user-agent']);

  return {
    clientIp: request.ip,
    isSecure: request.secure,
    deviceType: userAgent.browser.name || userAgent.device.type || (request.headers.devicemodel as string) || '',
    deviceOS: userAgent.os.name || (request.headers.devicetype as string) || '',
  };
});

export interface AuthRequest extends Request {
  user?: AuthDto;
}

export interface AuthenticatedRequest extends Request {
  user: AuthDto;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
    private reflector: Reflector,
    private authService: AuthService,
  ) {
    this.logger.setContext(AuthGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler()];

    const options = this.reflector.getAllAndOverride<AuthenticatedOptions | undefined>(Metadata.AUTH_ROUTE, targets);
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();

    const authDto = await this.authService.validate(request.headers, request.query as Record<string, string>);
    if (authDto.sharedLink && !(options as SharedLinkRoute).sharedLink) {
      this.logger.warn(`Denied access to non-shared route: ${request.path}`);
      return false;
    }

    if (!authDto.user.isAdmin && (options as AdminRoute).admin) {
      this.logger.warn(`Denied access to admin only route: ${request.path}`);
      return false;
    }

    request.user = authDto;

    return true;
  }
}
