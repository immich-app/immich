import { QueryKeys } from '#lib/queries/query-keys.ts';
import { getMapMarkers } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const getMapMarkersQuery = (params: Parameters<typeof getMapMarkers>[0]) =>
  queryOptions({
    queryKey: QueryKeys.mapMarkers(params),
    queryFn: ({ signal }) => getMapMarkers(params, { signal }),
    staleTime: 0,
  });
