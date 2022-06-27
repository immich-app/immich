import { UserResponseDto } from './api-v1/user/response-dto/user-response.dto';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends UserResponseDto {}
  }
}
