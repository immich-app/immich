import { QueryKeys } from '#lib/queries/query-keys.ts';
import { getTimeBucket, getTimeBuckets } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

type TimeBucketsParams = Parameters<typeof getTimeBuckets>[0];
type TimeBucketParams = Parameters<typeof getTimeBucket>[0];

export const getTimeBucketsQuery = (params: TimeBucketsParams) =>
  queryOptions({
    queryKey: QueryKeys.timeBuckets(params),
    queryFn: ({ signal }) => getTimeBuckets(params, { signal }),
    staleTime: 0,
    gcTime: 0,
  });

export const getTimeBucketQuery = (params: TimeBucketParams) =>
  queryOptions({
    queryKey: QueryKeys.timeBucket(params),
    queryFn: ({ signal }) => getTimeBucket(params, { signal }),
    staleTime: 0,
    gcTime: 0,
  });
