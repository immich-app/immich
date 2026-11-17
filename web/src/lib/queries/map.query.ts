import { getMapMarkers } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const mapMarkersQueryKey = ['map', 'markers'];

export const getMapMarkersQuery = (params: Parameters<typeof getMapMarkers>[0]) =>
  queryOptions({
    queryKey: [...mapMarkersQueryKey, params],
    queryFn: ({ signal }) => getMapMarkers(params, { signal }),
    staleTime: 0,
  });
