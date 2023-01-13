export { AuthUserDto } from '@app/domain';
import { AuthUserDto } from '@app/domain';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetAuthUser = createParamDecorator((data, ctx: ExecutionContext): AuthUserDto => {
  return ctx.switchToHttp().getRequest<{ user: AuthUserDto }>().user;
});
