import { QueryKeys } from '#lib/queries/query-keys.ts';
import { getPublicConfig } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const getPublicConfigQuery = () =>
  queryOptions({
    queryKey: QueryKeys.publicConfig(),
    queryFn: ({ signal }) => getPublicConfig({ signal }),
    gcTime: Infinity,
  });
