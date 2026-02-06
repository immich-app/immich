import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  applyDecorators,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiBearerAuth, ApiCookieAuth, ApiExtension, ApiOkResponse, ApiSecurity } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthDto } from 'src/dtos/auth.dto';
import { ApiCustomExtension, MetadataKey, Permission } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { AuthService, LoginDetails } from 'src/services/auth.service';
import { getUserAgentDetails } from 'src/utils/request';

type AdminRoute = { admin?: true };
type AuthenticatedOptions = { permission?: Permission | false } & AdminRoute;

export const Authenticated = (options: AuthenticatedOptions = {}): MethodDecorator => {
  const decorators: MethodDecorator[] = [
    ApiBearerAuth(),
    ApiCookieAuth(),
    ApiSecurity(MetadataKey.ApiKeySecurity),
    SetMetadata(MetadataKey.AuthRoute, options),
  ];

  if ((options as AdminRoute).admin) {
    decorators.push(ApiExtension(ApiCustomExtension.AdminOnly, true));
  }

  if (options?.permission) {
    decorators.push(ApiExtension(ApiCustomExtension.Permission, options.permission));
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
  const { deviceType, deviceOS, appVersion } = getUserAgentDetails(request.headers);

  return {
    clientIp: request.ip ?? '',
    isSecure: request.secure,
    deviceType,
    deviceOS,
    appVersion,
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
    private logger: LoggingRepository,
    private reflector: Reflector,
    private authService: AuthService,
  ) {
    this.logger.setContext(AuthGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler()];
    const options = this.reflector.getAllAndOverride<AuthenticatedOptions | undefined>(MetadataKey.AuthRoute, targets);
    if (!options) {
      return true;
    }

    const { admin: adminRoute, permission } = { admin: false, ...options };
    const request = context.switchToHttp().getRequest<AuthRequest>();

    request.user = await this.authService.authenticate({
      headers: request.headers,
      queryParams: request.query as Record<string, string>,
      metadata: { adminRoute, permission, uri: request.path },
    });

    return true;
  }
}
