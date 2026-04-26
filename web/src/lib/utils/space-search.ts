import { buildFilterContext, type FilterState } from '$lib/components/filter-panel/filter-panel';
import { AssetOrder, AssetTypeEnum, type SmartSearchDto } from '@immich/sdk';

export const SEARCH_FILTER_DEBOUNCE_MS = 250;

export function buildSmartSearchParams(args: {
  query: string;
  filters: FilterState;
  spaceId?: string;
  withSharedSpaces?: boolean;
}): SmartSearchDto {
  const { query, filters, spaceId, withSharedSpaces } = args;
  const params: SmartSearchDto = { query };

  if (spaceId) {
    params.spaceId = spaceId;
    if (filters.personIds.length > 0) {
      params.spacePersonIds = filters.personIds;
    }
  } else {
    if (filters.personIds.length > 0) {
      params.personIds = filters.personIds;
    }
    if (withSharedSpaces) {
      params.withSharedSpaces = true;
    }
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
  const context = buildFilterContext(filters);
  if (context?.takenAfter) {
    params.takenAfter = context.takenAfter;
  }
  if (context?.takenBefore) {
    params.takenBefore = context.takenBefore;
  }

  if (filters.sortOrder === 'asc') {
    params.order = AssetOrder.Asc;
  } else if (filters.sortOrder === 'desc') {
    params.order = AssetOrder.Desc;
  }

  if (filters.isFavorite !== undefined) {
    params.isFavorite = filters.isFavorite;
  }

  return params;
}
