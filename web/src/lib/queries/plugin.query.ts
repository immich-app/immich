import { QueryKeys } from '#lib/queries/query-keys.ts';
import { searchPluginMethods, searchPluginTemplates, type WorkflowTrigger } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const searchPluginMethodsQuery = (filter: { trigger?: WorkflowTrigger } = {}) =>
  queryOptions({
    queryKey: QueryKeys.pluginMethods(filter),
    queryFn: ({ signal }) => searchPluginMethods(filter, { signal }),
  });

export const searchPluginTemplatesQuery = () =>
  queryOptions({
    queryKey: QueryKeys.pluginTemplates(),
    queryFn: ({ signal }) => searchPluginTemplates({ signal }),
  });
