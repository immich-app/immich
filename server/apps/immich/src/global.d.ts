import { AuthUserDto } from './decorators/auth-user.decorator';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends AuthUserDto {}
  }
}
