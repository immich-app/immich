import { AuthDto } from '@app/domain';
import { UserEntity } from '@app/infra/entities';

export const CLI_USER: AuthDto = {
  user: {
    id: 'cli',
    email: 'cli@immich.app',
    isAdmin: true,
  } as UserEntity,
};
