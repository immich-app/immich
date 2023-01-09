import { createParamDecorator, ExecutionContext } from '@nestjs/common';
// import { AuthUserDto } from './dto/auth-user.dto';

export class AuthUserDto {
  id!: string;
  email!: string;
  isAdmin!: boolean;
  isPublicUser?: boolean;
  sharedLinkId?: string;
  isAllowUpload?: boolean;
}

export const GetAuthUser = createParamDecorator((data, ctx: ExecutionContext): AuthUserDto => {
  return ctx.switchToHttp().getRequest<{ user: AuthUserDto }>().user;
});
