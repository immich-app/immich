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
import { MetadataKey, Permission } from 'src/enum';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { AuthService, LoginDetails } from 'src/services/auth.service';
import { UAParser } from 'ua-parser-js';

type AdminRoute = { admin?: true };
type SharedLinkRoute = { sharedLink?: true };
type AuthenticatedOptions = { permission?: Permission } & (AdminRoute | SharedLinkRoute);

export const Authenticated = (options?: AuthenticatedOptions): MethodDecorator => {
  const decorators: MethodDecorator[] = [
    ApiBearerAuth(),
    ApiCookieAuth(),
    ApiSecurity(MetadataKey.API_KEY_SECURITY),
    SetMetadata(MetadataKey.AUTH_ROUTE, options || {}),
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

    const options = this.reflector.getAllAndOverride<AuthenticatedOptions | undefined>(MetadataKey.AUTH_ROUTE, targets);
    if (!options) {
      return true;
    }

    const {
      admin: adminRoute,
      sharedLink: sharedLinkRoute,
      permission,
    } = { sharedLink: false, admin: false, ...options };
    const request = context.switchToHttp().getRequest<AuthRequest>();

    request.user = await this.authService.authenticate({
      headers: request.headers,
      queryParams: request.query as Record<string, string>,
      metadata: { adminRoute, sharedLinkRoute, permission, uri: request.path },
    });

    return true;
  }
}
