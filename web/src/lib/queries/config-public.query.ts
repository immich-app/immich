import { getPublicConfig } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const getPublicConfigQuery = () =>
  queryOptions({
    queryKey: ['config', 'public'],
    queryFn: ({ signal }) => getPublicConfig({ signal }),
    gcTime: Infinity,
  });
