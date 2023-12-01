import { AuthUserDto } from '@app/domain';

export const CLI_USER: AuthUserDto = {
  id: 'cli',
  email: 'cli@immich.app',
  isAdmin: true,
  isPublicUser: false,
  isAllowUpload: true,
};
