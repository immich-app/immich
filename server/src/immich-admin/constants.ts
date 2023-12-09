import { AuthDto } from '@app/domain';

export const CLI_USER: AuthDto = {
  id: 'cli',
  email: 'cli@immich.app',
  isAdmin: true,
  isPublicUser: false,
  isAllowUpload: true,
};
