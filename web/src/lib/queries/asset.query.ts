import { asMutation } from '#lib/queries/client.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import { getAssetStatistics, runAssetJobs } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

type AssetStatisticsFilter = Parameters<typeof getAssetStatistics>[0];

export const getAssetStatisticsQuery = (filter: AssetStatisticsFilter) =>
  queryOptions({
    queryKey: QueryKeys.assetStatistics(filter),
    queryFn: ({ signal }) => getAssetStatistics(filter, { signal }),
    staleTime: 0,
  });

export const runAssetJobsMutation = () =>
  asMutation(runAssetJobs, { meta: { error: { toast: 'errors.unable_to_submit_job' } } });
