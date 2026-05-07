import type { PeopleFaceStatisticsResponseDto } from '@immich/sdk';

const statisticsCache = new Map<string, PeopleFaceStatisticsResponseDto>();

export const clearPeopleFaceStatisticsInfoCache = () => statisticsCache.clear();

export const getCachedPeopleFaceStatistics = (cacheKey: string) => statisticsCache.get(cacheKey);

export const setCachedPeopleFaceStatistics = (cacheKey: string, statistics: PeopleFaceStatisticsResponseDto) => {
  statisticsCache.set(cacheKey, statistics);
};
