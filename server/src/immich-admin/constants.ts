import { AuthDto } from 'src/domain';
import { UserEntity } from 'src/infra/entities';

export const CLI_USER: AuthDto = {
  user: {
    id: 'cli',
    email: 'cli@immich.app',
    isAdmin: true,
  } as UserEntity,
};
