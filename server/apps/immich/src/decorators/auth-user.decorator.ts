import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from '@app/database';
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
  const req = ctx.switchToHttp().getRequest<{ user: AuthUserDto }>();

  // const { id, email, isAdmin } = req.user;

  // const authUser: AuthUserDto = {
  //   id: id.toString(),
  //   email,
  //   isAdmin,
  // };

  return req.user;
});
