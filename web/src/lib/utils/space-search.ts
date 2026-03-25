import type { FilterState } from '$lib/components/filter-panel/filter-panel';
import { AssetTypeEnum, type SmartSearchDto } from '@immich/sdk';

export const SEARCH_FILTER_DEBOUNCE_MS = 250;

export function buildSmartSearchParams(query: string, spaceId: string, filters: FilterState): SmartSearchDto {
  const params: SmartSearchDto = { query, spaceId };

  if (filters.personIds.length > 0) {
    params.spacePersonIds = filters.personIds;
  }
  if (filters.city) {
    params.city = filters.city;
  }
  if (filters.country) {
    params.country = filters.country;
  }
  if (filters.make) {
    params.make = filters.make;
  }
  if (filters.model) {
    params.model = filters.model;
  }
  if (filters.tagIds.length > 0) {
    params.tagIds = filters.tagIds;
  }
  if (filters.rating !== undefined) {
    params.rating = filters.rating;
  }
  if (filters.mediaType !== 'all') {
    params.type = filters.mediaType === 'image' ? AssetTypeEnum.Image : AssetTypeEnum.Video;
  }
  if (filters.selectedYear && filters.selectedMonth) {
    const start = new Date(filters.selectedYear, filters.selectedMonth - 1, 1);
    const end = new Date(filters.selectedYear, filters.selectedMonth, 0, 23, 59, 59, 999);
    params.takenAfter = start.toISOString();
    params.takenBefore = end.toISOString();
  } else if (filters.selectedYear) {
    params.takenAfter = new Date(filters.selectedYear, 0, 1).toISOString();
    params.takenBefore = new Date(filters.selectedYear, 11, 31, 23, 59, 59, 999).toISOString();
  }

  return params;
}
