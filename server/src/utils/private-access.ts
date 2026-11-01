import { AuthDto } from 'src/dtos/auth.dto.js';
import { PrivateTagAccessOptions } from 'src/utils/database.js';

export const getPrivateAccessOptions = (auth?: AuthDto): PrivateTagAccessOptions => ({
  albumUserId: auth?.sharedLink ? undefined : auth?.user.id,
  sharedLinkId: auth?.sharedLink?.id,
  includePrivate: auth?.session?.hasElevatedPermission,
  privateOwnerId: auth?.user.id,
});
