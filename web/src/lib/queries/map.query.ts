import { QueryKeys } from '#lib/queries/query-keys.ts';
import { getMapMarkers, reverseGeocode } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const getMapMarkersQuery = (params: Parameters<typeof getMapMarkers>[0]) =>
  queryOptions({
    queryKey: QueryKeys.mapMarkers(params),
    queryFn: ({ signal }) => getMapMarkers(params, { signal }),
    staleTime: 0,
  });

export const reverseGeocodeQuery = (params: Parameters<typeof reverseGeocode>[0]) =>
  queryOptions({
    queryKey: QueryKeys.mapReverseGeocode(params),
    queryFn: ({ signal }) => reverseGeocode(params, { signal }),
  });
