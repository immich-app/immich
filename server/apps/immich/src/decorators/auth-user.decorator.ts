import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserEntity } from '@app/database/entities/user.entity';
// import { AuthUserDto } from './dto/auth-user.dto';

export class AuthUserDto {
  id: string;
  email: string;
}

export const GetAuthUser = createParamDecorator((data, ctx: ExecutionContext): AuthUserDto => {
  const req = ctx.switchToHttp().getRequest();

  const { id, email } = req.user as UserEntity;

  const authUser: any = {
    id: id.toString(),
    email,
  };

  return authUser;
});
