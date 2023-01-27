import { UseGuards } from '@nestjs/common';
import { AdminRolesGuard } from '../middlewares/admin-role-guard.middleware';
import { RouteNotSharedGuard } from '../middlewares/route-not-shared-guard.middleware';
import { AuthGuard } from '../modules/immich-auth/guards/auth.guard';

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
    guards.push(RouteNotSharedGuard);
  }

  return UseGuards(...guards);
};
