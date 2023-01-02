import { UseGuards } from '@nestjs/common';
import { AdminRolesGuard } from '../middlewares/admin-role-guard.middleware';
import { AuthGuard } from '../modules/immich-jwt/guards/auth.guard';

interface AuthenticatedOptions {
  admin?: boolean;
}

export const Authenticated = (options?: AuthenticatedOptions) => {
  const guards: Parameters<typeof UseGuards> = [AuthGuard];
  options = options || {};
  if (options.admin) {
    guards.push(AdminRolesGuard);
  }
  return UseGuards(...guards);
};
