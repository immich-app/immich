import { getAboutInfo, getServerStatistics, getStorage, getVersionHistory } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const getAboutInfoQuery = () =>
  queryOptions({
    queryKey: ['server', 'about'],
    queryFn: ({ signal }) => getAboutInfo({ signal }),
    staleTime: Infinity,
  });

export const getVersionHistoryQuery = () =>
  queryOptions({
    queryKey: ['server', 'version-history'],
    queryFn: ({ signal }) => getVersionHistory({ signal }),
    staleTime: Infinity,
  });

export const getStorageQuery = () =>
  queryOptions({
    queryKey: ['server', 'storage'],
    queryFn: ({ signal }) => getStorage({ signal }),
    staleTime: Infinity,
  });

export const getServerStatisticsQuery = () =>
  queryOptions({
    queryKey: ['server', 'statistics'],
    queryFn: ({ signal }) => getServerStatistics({ signal }),
  });
