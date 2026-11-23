import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants.js';
import { Reflector } from '@nestjs/core';
import { controllers } from 'src/controllers/index.js';
import { QueueName } from 'src/enum.js';
import { Resource } from 'src/resource-paths.js';
import { newUuid } from 'test/small.factory.js';

type ResourceName = keyof typeof Resource;

const prefixOnly = new Set<ResourceName>(['assets', 'clusterGroup', 'search', 'view']);

const params = { id: newUuid(), name: QueueName.MetadataExtraction };

const reflector = new Reflector();

const toSegments = (path: string) => path.split('/').filter(Boolean);

const getRoutes = () =>
  controllers.flatMap((controller) => {
    const prefix = reflector.get<string>(PATH_METADATA, controller);
    return Object.values(Object.getOwnPropertyDescriptors(controller.prototype))
      .map(({ value }) => value)
      .filter((handler) => reflector.get(METHOD_METADATA, handler) === RequestMethod.GET)
      .map((handler) => toSegments(`${prefix}/${reflector.get(PATH_METADATA, handler)}`));
  });

const routes = getRoutes();

const startsWith = (route: string[], path: string[]) =>
  path.every((segment, index) => route[index]?.startsWith(':') || route[index] === segment);

const isRoute = (path: string[]) => routes.some((route) => route.length === path.length && startsWith(route, path));

const isRoutePrefix = (path: string[]) => routes.some((route) => route.length > path.length && startsWith(route, path));

const entries = Object.entries(Resource).map(([name, resource]) => ({
  name: name as ResourceName,
  path: (resource as (sample: typeof params) => string)(params),
}));

describe('Resource', () => {
  it.each(entries.filter(({ name }) => !prefixOnly.has(name)))('$name ($path) is a GET route', ({ path }) => {
    expect(isRoute(toSegments(path))).toBe(true);
  });

  it.each(entries.filter(({ name }) => prefixOnly.has(name)))('$name ($path) is a GET route prefix', ({ path }) => {
    expect(isRoute(toSegments(path))).toBe(false);
    expect(isRoutePrefix(toSegments(path))).toBe(true);
  });
});
