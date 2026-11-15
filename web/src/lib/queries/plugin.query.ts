import { searchPluginMethods, searchPluginTemplates, type WorkflowTrigger } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const searchPluginMethodsQuery = (filter: { trigger?: WorkflowTrigger } = {}) =>
  queryOptions({
    queryKey: ['plugins', 'methods', filter],
    queryFn: ({ signal }) => searchPluginMethods(filter, { signal }),
  });

export const searchPluginTemplatesQuery = () =>
  queryOptions({
    queryKey: ['plugins', 'templates'],
    queryFn: ({ signal }) => searchPluginTemplates({ signal }),
  });
