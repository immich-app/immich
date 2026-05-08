import { buildFilterContext, type FilterState } from '$lib/components/filter-panel/filter-panel';
import { createUrl } from '$lib/utils';
import { getPhotosPersonFilterThumbnailUrl } from '$lib/utils/photos-filter-options';
import {
  AssetOrder,
  AssetTypeEnum,
  type SmartSearchDto,
  type SmartSearchFacetsDto,
  type SmartSearchFacetsResponseDto,
} from '@immich/sdk';

export const SEARCH_FILTER_DEBOUNCE_MS = 250;

type SmartSearchParamsArgs = {
  query: string;
  filters: FilterState;
  spaceId?: string;
  withSharedSpaces?: boolean;
  language?: string;
};

export function buildSmartSearchParams(args: SmartSearchParamsArgs): SmartSearchDto {
  const { query, filters, spaceId, withSharedSpaces, language } = args;
  const params: SmartSearchDto = { query };
  if (language) {
    params.language = language;
  }

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
  if (filters.isNotInAlbum === true) {
    params.isNotInAlbum = true;
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

export function buildSmartSearchFacetsParams(args: SmartSearchParamsArgs): SmartSearchFacetsDto {
  const { order: _, ...params } = buildSmartSearchParams(args);
  return params;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

export function buildSmartSearchFacetKey(args: SmartSearchParamsArgs): string {
  return stableJson(buildSmartSearchFacetsParams(args));
}

export function mapSmartSearchFacetsToFilterSuggestions(
  facets: SmartSearchFacetsResponseDto,
  options: { spaceId?: string } = {},
) {
  return {
    countries: facets.countries,
    cities: facets.cities,
    cameraMakes: facets.cameraMakes,
    cameraModels: facets.cameraModels,
    tags: facets.tags.map((tag) => ({ id: tag.id, name: tag.value })),
    people: facets.people.map((person) => ({
      id: person.id,
      name: person.name,
      thumbnailUrl: options.spaceId
        ? createUrl(`/shared-spaces/${options.spaceId}/people/${person.id}/thumbnail`)
        : getPhotosPersonFilterThumbnailUrl(person),
    })),
    ratings: facets.ratings,
    mediaTypes: facets.mediaTypes,
    hasUnnamedPeople: facets.hasUnnamedPeople,
  };
}
