import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { controllers } from 'src/controllers';
import { AuthenticatedOptions, getAuthenticatedOptions } from 'src/middleware/auth.guard';

const UNAUTHENTICATED_ADMIN_ROUTES = new Set([
  'GET admin/maintenance/status',
  'POST admin/maintenance/login',
  'POST admin/database-backups/start-restore',
]);

const isAdminPermission = (permission: AuthenticatedOptions['permission']) =>
  typeof permission === 'string' && permission.startsWith('admin');

const getRoutes = () => {
  const reflector = new Reflector();

  return controllers.flatMap((Controller) => {
    const prefix = reflector.get<string>(PATH_METADATA, Controller);

    return Object.getOwnPropertyNames(Controller.prototype).flatMap((name) => {
      const handler = Object.getOwnPropertyDescriptor(Controller.prototype, name)?.value;
      if (typeof handler !== 'function') {
        return [];
      }

      const requestMethod = reflector.get<RequestMethod | undefined>(METHOD_METADATA, handler);
      if (requestMethod === undefined) {
        return [];
      }

      const method = RequestMethod[requestMethod];
      const path = [prefix, reflector.get<string>(PATH_METADATA, handler)].filter((part) => part !== '/').join('/');

      return {
        id: `${method} ${path}`,
        label: `${Controller.name}.${name} (${method} /${path})`,
        path,
        auth: getAuthenticatedOptions(reflector, handler),
      };
    });
  });
};

describe('controllers', () => {
  const routes = getRoutes();
  const adminRoutes = routes.filter((route) => route.path === 'admin' || route.path.startsWith('admin/'));

  it('should only allow non-admin access to bootstrap routes under admin/', () => {
    const reachableByNonAdmins = adminRoutes.filter((route) => !route.auth?.admin).map((route) => route.id);

    expect(new Set(reachableByNonAdmins)).toEqual(UNAUTHENTICATED_ADMIN_ROUTES);
  });

  it('should not authenticate the bootstrap routes under admin/', () => {
    const authenticated = routes
      .filter((route) => UNAUTHENTICATED_ADMIN_ROUTES.has(route.id) && route.auth !== undefined)
      .map((route) => route.label);

    expect(authenticated).toEqual([]);
  });

  it('should require admin access for routes with an admin permission', () => {
    const offenders = routes
      .filter((route) => isAdminPermission(route.auth?.permission) && !route.auth?.admin)
      .map((route) => route.label);

    expect(offenders).toEqual([]);
  });
});
