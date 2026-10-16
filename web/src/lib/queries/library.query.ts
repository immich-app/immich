import { getLibraryStatistics } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const getLibraryStatisticsQuery = (id: string) =>
  queryOptions({
    queryKey: ['libraries', id, 'statistics'],
    queryFn: ({ signal }) => getLibraryStatistics({ id }, { signal }),
  });
