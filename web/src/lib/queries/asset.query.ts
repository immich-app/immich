import { getAssetStatistics } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

type AssetStatisticsFilter = Parameters<typeof getAssetStatistics>[0];

export const getAssetStatisticsQuery = (filter: AssetStatisticsFilter) =>
  queryOptions({
    queryKey: ['assets', 'statistics', filter],
    queryFn: ({ signal }) => getAssetStatistics(filter, { signal }),
    staleTime: 0,
  });
