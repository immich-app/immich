export { AuthUserDto } from '@app/domain';
import { AuthUserDto, LoginDetails } from '@app/domain';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';

export interface AuthRequest extends Request {
  user?: AuthUserDto;
}

export const AuthUser = createParamDecorator((data, ctx: ExecutionContext): AuthUserDto => {
  return ctx.switchToHttp().getRequest<{ user: AuthUserDto }>().user;
});

export const GetLoginDetails = createParamDecorator((data, ctx: ExecutionContext): LoginDetails => {
  const req = ctx.switchToHttp().getRequest();
  const userAgent = UAParser(req.headers['user-agent']);

  return {
    clientIp: req.clientIp,
    isSecure: req.secure,
    deviceType: userAgent.browser.name || userAgent.device.type || req.headers.devicemodel || '',
    deviceOS: userAgent.os.name || req.headers.devicetype || '',
  };
});
