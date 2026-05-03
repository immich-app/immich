import type { FilterState } from '$lib/components/filter-panel/filter-panel';
import { buildFilterContext } from '$lib/components/filter-panel/filter-panel';
import { createUrl } from '$lib/utils';
import { AssetOrder, AssetTypeEnum, AssetVisibility, type FilterSuggestionsPersonDto } from '@immich/sdk';

export function buildPhotosTimelineOptions(filters: FilterState): Record<string, unknown> {
  const includeSharedTimelineAssets = filters.isFavorite === undefined;
  const base: Record<string, unknown> = {
    visibility: AssetVisibility.Timeline,
    withStacked: true,
    ...(includeSharedTimelineAssets ? { withPartners: true, withSharedSpaces: true } : {}),
  };

  if (filters.personIds.length > 0) {
    base.personIds = filters.personIds;
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
  if (context) {
    if (context.takenAfter) {
      base.takenAfter = context.takenAfter;
    }
    if (context.takenBefore) {
      base.takenBefore = context.takenBefore;
    }
  }

  return base;
}

export function getPhotosPersonFilterThumbnailUrl(
  person: Pick<FilterSuggestionsPersonDto, 'id' | 'primaryProfile'>,
): string {
  const profile = person.primaryProfile;

  if (profile?.type === 'space-person' && profile.spaceId) {
    return createUrl(`/shared-spaces/${profile.spaceId}/people/${profile.id}/thumbnail`);
  }

  if (profile?.type === 'user-person') {
    return createUrl(`/people/${profile.id}/thumbnail`);
  }

  const userPersonId = person.id.startsWith('person:') ? person.id.slice('person:'.length) : person.id;
  return createUrl(`/people/${userPersonId}/thumbnail`);
}

export function handlePhotosRemoveFilter(filters: FilterState, type: string, id?: string): FilterState {
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
