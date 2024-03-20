import { AuthDto } from 'src/domain/auth/auth.dto';
import { UserEntity } from 'src/infra/entities/user.entity';

export const CLI_USER: AuthDto = {
  user: {
    id: 'cli',
    email: 'cli@immich.app',
    isAdmin: true,
  } as UserEntity,
};
