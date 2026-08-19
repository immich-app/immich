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

/** Admin-only routes that live outside `admin/`, i.e. `@Authenticated({ admin: true })` */
const ADMIN_ROUTES = new Set([
  'DELETE libraries/:id',
  'DELETE queues/:name/jobs',
  'DELETE server/license',
  'GET jobs',
  'GET libraries',
  'GET libraries/:id',
  'GET libraries/:id/statistics',
  'GET queues',
  'GET queues/:name',
  'GET queues/:name/jobs',
  'GET server/license',
  'GET server/statistics',
  'GET system-config',
  'GET system-config/defaults',
  'GET system-config/storage-template-options',
  'GET system-metadata/admin-onboarding',
  'GET system-metadata/reverse-geocoding-state',
  'GET system-metadata/version-check-state',
  'PATCH libraries/:id',
  'POST jobs',
  'POST libraries',
  'POST libraries/:id/scan',
  'POST libraries/:id/validate',
  'POST system-metadata/admin-onboarding',
  'PUT jobs/:name',
  'PUT libraries/:id',
  'PUT queues/:name',
  'PUT server/license',
  'PUT system-config',
]);

/** Routes a shared link (`?key=`) is allowed to reach, i.e. `@Authenticated({ sharedLink: true })` */
const SHARED_LINK_ROUTES = new Set([
  'DELETE assets/:id/video/stream/:sessionId',
  'GET albums/:id',
  'GET albums/:id/map-markers',
  'GET assets/:id',
  'GET assets/:id/original',
  'GET assets/:id/thumbnail',
  'GET assets/:id/video/playback',
  'GET assets/:id/video/stream/:sessionId/:variantIndex/:filename',
  'GET assets/:id/video/stream/:sessionId/:variantIndex/playlist.m3u8',
  'GET assets/:id/video/stream/main.m3u8',
  'GET shared-links/me',
  'GET timeline/bucket',
  'GET timeline/buckets',
  'POST assets',
  'POST download/archive',
  'POST download/info',
  'POST search/metadata',
  'POST shared-links/login',
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

  it('should only allow non-admin access to bootstrap routes under admin/', () => {
    const adminRoutes = routes.filter((route) => route.path === 'admin' || route.path.startsWith('admin/'));
    const reachableByNonAdmins = adminRoutes.filter((route) => !route.auth?.admin).map((route) => route.id);

    expect(new Set(reachableByNonAdmins)).toEqual(UNAUTHENTICATED_ADMIN_ROUTES);
  });

  it('should declare authentication on every route', () => {
    const undeclared = routes.filter((route) => route.auth === undefined).map((route) => route.label);

    expect(undeclared).toEqual([]);
  });

  it('should only allow shared link access to expected routes', () => {
    const sharedLinkRoutes = routes.filter((route) => route.auth?.sharedLink).map((route) => route.id);

    expect(new Set(sharedLinkRoutes)).toEqual(SHARED_LINK_ROUTES);
  });

  it('should only require admin access on expected routes outside /admin', () => {
    const adminRoutes = routes
      .filter((route) => route.auth?.admin && route.path !== 'admin' && !route.path.startsWith('admin/'))
      .map((route) => route.id);

    expect(new Set(adminRoutes)).toEqual(ADMIN_ROUTES);
  });

  it('should require admin access for routes with an admin permission', () => {
    const offenders = routes
      .filter((route) => isAdminPermission(route.auth?.permission) && !route.auth?.admin)
      .map((route) => route.label);

    expect(offenders).toEqual([]);
  });
});
