import { getAboutInfo, getServerStatistics, getStorage, getVersionHistory } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const getAboutInfoQuery = () =>
  queryOptions({
    queryKey: ['server', 'about'],
    queryFn: ({ signal }) => getAboutInfo({ signal }),
  });

export const getVersionHistoryQuery = () =>
  queryOptions({
    queryKey: ['server', 'version-history'],
    queryFn: ({ signal }) => getVersionHistory({ signal }),
  });

export const getStorageQuery = () =>
  queryOptions({
    queryKey: ['server', 'storage'],
    queryFn: ({ signal }) => getStorage({ signal }),
  });

export const getServerStatisticsQuery = () =>
  queryOptions({
    queryKey: ['server', 'statistics'],
    queryFn: ({ signal }) => getServerStatistics({ signal }),
  });
