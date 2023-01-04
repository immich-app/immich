import { UseGuards } from '@nestjs/common';
import { AdminRolesGuard } from '../middlewares/admin-role-guard.middleware';
import { ShareRoleGuard } from '../middlewares/share-role-guard.middleware';
import { AuthGuard } from '../modules/immich-jwt/guards/auth.guard';

interface AuthenticatedOptions {
  admin?: boolean;
  isShared?: boolean;
}

export const Authenticated = (options?: AuthenticatedOptions) => {
  const guards: Parameters<typeof UseGuards> = [AuthGuard];

  options = options || {};

  if (options.admin) {
    guards.push(AdminRolesGuard);
  }

  if (!options.isShared) {
    console.log('Authenticated decorator: isShared is false, pushing ShareRoleGuard');
    guards.push(ShareRoleGuard);
  }

  return UseGuards(...guards);
};
