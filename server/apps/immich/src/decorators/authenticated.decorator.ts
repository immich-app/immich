import { UseGuards } from '@nestjs/common';
import { AdminRolesGuard } from '../middlewares/admin-role-guard.middleware';
import { JwtAuthGuard } from '../modules/immich-jwt/guards/jwt-auth.guard';

interface AuthenticatedOptions {
  admin?: boolean;
}

export const Authenticated = (options?: AuthenticatedOptions) => {
  const guards: Parameters<typeof UseGuards> = [JwtAuthGuard];
  options = options || {};
  if (options.admin) {
    guards.push(AdminRolesGuard);
  }
  return UseGuards(...guards);
};
