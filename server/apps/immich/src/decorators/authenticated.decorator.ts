import { applyDecorators, SetMetadata } from '@nestjs/common';

interface AuthenticatedOptions {
  admin?: boolean;
  isShared?: boolean;
}

export enum Metadata {
  AUTH_ROUTE = 'auth_route',
  ADMIN_ROUTE = 'admin_route',
  SHARED_ROUTE = 'shared_route',
}

export const Authenticated = (options?: AuthenticatedOptions) => {
  const decorators = [SetMetadata(Metadata.AUTH_ROUTE, true)];

  options = options || {};

  if (options.admin) {
    decorators.push(SetMetadata(Metadata.ADMIN_ROUTE, true));
  }

  if (options.isShared) {
    decorators.push(SetMetadata(Metadata.SHARED_ROUTE, true));
  }

  return applyDecorators(...decorators);
};
