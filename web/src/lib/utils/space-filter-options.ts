import { buildFilterContext, type FilterState } from '$lib/components/filter-panel/filter-panel';
import { AssetOrder, AssetTypeEnum } from '@immich/sdk';

export function buildSpaceTimelineOptions(spaceId: string, filters: FilterState): Record<string, unknown> {
  const base: Record<string, unknown> = { spaceId, withStacked: true };

  if (filters.personIds.length > 0) {
    base.spacePersonIds = filters.personIds;
  }
  if (filters.city) {
    base.city = filters.city;
  }
  if (filters.country) {
    base.country = filters.country;
  }
  if (filters.make) {
    base.make = filters.make;
  }
  if (filters.model) {
    base.model = filters.model;
  }
  if (filters.tagIds.length > 0) {
    base.tagIds = filters.tagIds;
  }
  if (filters.rating !== undefined) {
    base.rating = filters.rating;
  }
  if (filters.isFavorite !== undefined) {
    base.isFavorite = filters.isFavorite;
  }
  if (filters.mediaType !== 'all') {
    base.$type = filters.mediaType === 'image' ? AssetTypeEnum.Image : AssetTypeEnum.Video;
  }
  base.order = filters.sortOrder === 'asc' ? AssetOrder.Asc : AssetOrder.Desc;

  const context = buildFilterContext(filters);
  if (context?.takenAfter) {
    base.takenAfter = context.takenAfter;
  }
  if (context?.takenBefore) {
    base.takenBefore = context.takenBefore;
  }

  return base;
}

export function handleSpaceRemoveFilter(filters: FilterState, type: string, id?: string): FilterState {
  switch (type) {
    case 'person': {
      return { ...filters, personIds: filters.personIds.filter((p) => p !== id) };
    }
    case 'location': {
      return { ...filters, city: undefined, country: undefined };
    }
    case 'camera': {
      return { ...filters, make: undefined, model: undefined };
    }
    case 'tag': {
      return { ...filters, tagIds: filters.tagIds.filter((t) => t !== id) };
    }
    case 'rating': {
      return { ...filters, rating: undefined };
    }
    case 'media':
    case 'mediaType': {
      return { ...filters, mediaType: 'all' };
    }
    case 'favorites':
    case 'isFavorite': {
      return { ...filters, isFavorite: undefined };
    }
    case 'timeline': {
      return {
        ...filters,
        dateAfter: undefined,
        dateBefore: undefined,
        selectedYear: undefined,
        selectedMonth: undefined,
      };
    }
    default: {
      return filters;
    }
  }
}
