import {
  buildFilterContext,
  type FilterPanelConfig,
  type FilterState,
} from '$lib/components/filter-panel/filter-panel';
import { getPhotosPersonFilterThumbnailUrl } from '$lib/utils/photos-filter-options';
import { AssetTypeEnum, getFilterSuggestions, getSearchSuggestions, SearchSuggestionType } from '@immich/sdk';

const sections = ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media', 'favorites'] as const;

function mapSuggestions(response: Awaited<ReturnType<typeof getFilterSuggestions>>) {
  return {
    countries: response.countries,
    cameraMakes: response.cameraMakes,
    tags: response.tags.map((tag) => ({ id: tag.id, name: tag.value })),
    people: response.people.map((person) => ({
      id: person.id,
      name: person.name,
      thumbnailUrl: getPhotosPersonFilterThumbnailUrl(person),
    })),
    ratings: response.ratings,
    mediaTypes: response.mediaTypes,
    hasUnnamedPeople: response.hasUnnamedPeople,
  };
}

function toSuggestionRequest(filters: FilterState) {
  const context = buildFilterContext(filters);
  return {
    personIds: filters.personIds.length > 0 ? filters.personIds : undefined,
    country: filters.country,
    city: filters.city,
    make: filters.make,
    model: filters.model,
    tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
    rating: filters.rating,
    isFavorite: filters.isFavorite,
    mediaType:
      filters.mediaType === 'all'
        ? undefined
        : filters.mediaType === 'image'
          ? AssetTypeEnum.Image
          : AssetTypeEnum.Video,
    takenAfter: context?.takenAfter,
    takenBefore: context?.takenBefore,
  };
}

export function buildAlbumDetailFilterConfig(albumId: string): FilterPanelConfig {
  return {
    sections: [...sections],
    suggestionsProvider: async (filters) =>
      mapSuggestions(await getFilterSuggestions({ albumId, ...toSuggestionRequest(filters) })),
    providers: {
      cities: (country, context) =>
        getSearchSuggestions({ $type: SearchSuggestionType.City, albumId, country, ...context }),
      cameraModels: (make, context) =>
        getSearchSuggestions({ $type: SearchSuggestionType.CameraModel, albumId, make, ...context }),
    },
  };
}

export function buildAlbumAssetPickerFilterConfig(): FilterPanelConfig {
  return {
    sections: [...sections],
    suggestionsProvider: async (filters) => mapSuggestions(await getFilterSuggestions(toSuggestionRequest(filters))),
    providers: {
      cities: (country, context) => getSearchSuggestions({ $type: SearchSuggestionType.City, country, ...context }),
      cameraModels: (make, context) =>
        getSearchSuggestions({ $type: SearchSuggestionType.CameraModel, make, ...context }),
    },
  };
}
