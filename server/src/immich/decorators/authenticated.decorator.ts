import { IMMICH_API_KEY_NAME } from '@app/domain';
import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiQuery, ApiSecurity } from '@nestjs/swagger';

interface AuthenticatedOptions {
  admin?: boolean;
  isShared?: boolean;
}

export enum Metadata {
  AUTH_ROUTE = 'auth_route',
  ADMIN_ROUTE = 'admin_route',
  SHARED_ROUTE = 'shared_route',
  PUBLIC_SECURITY = 'public_security',
}

const adminDecorator = SetMetadata(Metadata.ADMIN_ROUTE, true);

const sharedLinkDecorators = [
  SetMetadata(Metadata.SHARED_ROUTE, true),
  ApiQuery({ name: 'key', type: String, required: false }),
];

export const Authenticated = (options: AuthenticatedOptions = {}) => {
  const decorators: MethodDecorator[] = [
    ApiBearerAuth(),
    ApiCookieAuth(),
    ApiSecurity(IMMICH_API_KEY_NAME),
    SetMetadata(Metadata.AUTH_ROUTE, true),
  ];

  if (options.admin) {
    decorators.push(adminDecorator);
  }

  if (options.isShared) {
    decorators.push(...sharedLinkDecorators);
  }

  return applyDecorators(...decorators);
};

export const PublicRoute = () =>
  applyDecorators(SetMetadata(Metadata.AUTH_ROUTE, false), ApiSecurity(Metadata.PUBLIC_SECURITY));
export const SharedLinkRoute = () => applyDecorators(...sharedLinkDecorators);
export const AdminRoute = () => adminDecorator;
