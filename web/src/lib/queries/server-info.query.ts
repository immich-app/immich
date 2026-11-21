import { QueryKeys } from '#lib/queries/query-keys.ts';
import {
  getAboutInfo,
  getServerConfig,
  getServerFeatures,
  getServerStatistics,
  getServerVersion,
  getStorage,
  getSupportedMediaTypes,
  getVersionHistory,
} from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const getAboutInfoQuery = () =>
  queryOptions({
    queryKey: QueryKeys.serverAbout(),
    queryFn: ({ signal }) => getAboutInfo({ signal }),
    gcTime: Infinity,
  });

export const getVersionHistoryQuery = () =>
  queryOptions({
    queryKey: QueryKeys.serverVersionHistory(),
    queryFn: ({ signal }) => getVersionHistory({ signal }),
  });

export const getStorageQuery = () =>
  queryOptions({
    queryKey: QueryKeys.serverStorage(),
    queryFn: ({ signal }) => getStorage({ signal }),
  });

export const getServerConfigQuery = () =>
  queryOptions({
    queryKey: QueryKeys.serverConfig(),
    queryFn: ({ signal }) => getServerConfig({ signal }),
    gcTime: Infinity,
  });

export const getServerStatisticsQuery = () =>
  queryOptions({
    queryKey: QueryKeys.serverStatistics(),
    queryFn: ({ signal }) => getServerStatistics({ signal }),
  });

export const getServerVersionQuery = () =>
  queryOptions({
    queryKey: QueryKeys.serverVersion(),
    queryFn: ({ signal }) => getServerVersion({ signal }),
    select: ({ major, minor, patch }) => `${major}.${minor}.${patch}`,
  });

export const getServerFeaturesQuery = () =>
  queryOptions({
    queryKey: QueryKeys.serverFeatures(),
    queryFn: ({ signal }) => getServerFeatures({ signal }),
    staleTime: 0,
  });

export const getSupportedMediaTypesQuery = () =>
  queryOptions({
    queryKey: QueryKeys.serverMediaTypes(),
    queryFn: ({ signal }) => getSupportedMediaTypes({ signal }),
  });
