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
import { AuthDto, Permission } from 'src/dtos/auth.dto';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { AuthService, LoginDetails } from 'src/services/auth.service';
import { UAParser } from 'ua-parser-js';

export enum Metadata {
  SHARED_ROUTE = 'shared_route',
  PUBLIC_SECURITY = 'public_security',
  API_KEY_SECURITY = 'api_key',
  PERMISSION = 'auth_permission',
}

type AuthenticatedOptions = {
  sharedLink?: true;
  /** skip permission check when param id matches calling user */
  bypassParamId?: string;
};

export const Authenticated = (permission: Permission, options?: AuthenticatedOptions) => {
  const { sharedLink } = { sharedLink: false, ...options };

  const decorators = sharedLink
    ? [SetMetadata(Metadata.SHARED_ROUTE, true), ApiQuery({ name: 'key', type: String, required: false })]
    : [];

  return applyDecorators(
    ApiBearerAuth(),
    ApiCookieAuth(),
    ApiSecurity(Metadata.API_KEY_SECURITY),
    SetMetadata(Metadata.PERMISSION, permission),
    ...decorators,
  );
};

export const Auth = createParamDecorator((data, context: ExecutionContext): AuthDto => {
  return context.switchToHttp().getRequest<{ user: AuthDto }>().user;
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
    const method = context.getHandler();

    const permission = this.reflector.get<Permission>(Metadata.PERMISSION, method);
    const isSharedRoute = this.reflector.get<boolean>(Metadata.SHARED_ROUTE, method);

    // public
    if (!permission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();

    const authDto = await this.authService.validate(request.headers, request.query as Record<string, string>);
    const isApiKey = !!authDto.apiKey;
    const isUserToken = !!authDto.session;

    if (authDto.sharedLink && !isSharedRoute) {
      this.logger.warn(`Denied access to non-shared route: ${request.path}`);
      return false;
    }

    if ((isApiKey || isUserToken) && !authDto.user.permissions.includes(permission)) {
      this.logger.warn(`Denied access to route: no ${permission} permission: ${request.path}. `);
      return false;
    }

    request.user = authDto;

    return true;
  }
}
