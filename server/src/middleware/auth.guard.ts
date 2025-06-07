import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  applyDecorators,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiBearerAuth, ApiCookieAuth, ApiOkResponse, ApiQuery, ApiSecurity } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthDto } from 'src/dtos/auth.dto';
import { ImmichQuery, MetadataKey, Permission } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { AuthService, LoginDetails } from 'src/services/auth.service';
import { UAParser } from 'ua-parser-js';

type AdminRoute = { admin?: true };
type SharedLinkRoute = { sharedLink?: true };
type WebDavRoute = { webdav?: true };
type AuthenticatedOptions = { permission?: Permission } & (AdminRoute | SharedLinkRoute | WebDavRoute);

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
    clientIp: request.ip ?? '',
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
    private logger: LoggingRepository,
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
      webdav: webDavRoute,
      permission,
    } = { sharedLink: false, admin: false, webdav: false, ...options };
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    try {
      request.user = await this.authService.authenticate({
        headers: request.headers,
        queryParams: request.query as Record<string, string>,
        metadata: { adminRoute, sharedLinkRoute, permission, webDavRoute, uri: request.path },
      });

      return true;
    } catch (error) {
      // Add WWW-Authenticate header for WebDAV routes when authentication fails
      if (error instanceof UnauthorizedException && webDavRoute) {
        response.setHeader('WWW-Authenticate', 'Basic realm="Restricted"');
      }
      throw error;
    }
  }
}
