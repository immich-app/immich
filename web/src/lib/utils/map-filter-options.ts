import { buildFilterContext, type FilterState } from '$lib/components/filter-panel/filter-panel';
import { AssetTypeEnum, AssetVisibility, MapMediaType } from '@immich/sdk';

type MapTimelineSettings = {
  onlyFavorites?: boolean;
  withPartners?: boolean;
};

function applyCommonMapFilters(base: Record<string, unknown>, filters: FilterState, includePersonIds = true) {
  if (includePersonIds && filters.personIds.length > 0) {
    base.personIds = filters.personIds;
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
  if (filters.city) {
    base.city = filters.city;
  }
  if (filters.country) {
    base.country = filters.country;
  }

  const context = buildFilterContext(filters);
  if (context?.takenAfter) {
    base.takenAfter = context.takenAfter;
  }
  if (context?.takenBefore) {
    base.takenBefore = context.takenBefore;
  }

  return base;
}

export function buildMapMarkerOptions(filters: FilterState, spaceId?: string): Record<string, unknown> {
  const base = applyCommonMapFilters(spaceId ? { spaceId } : { withSharedSpaces: true }, filters);

  if (filters.mediaType !== 'all') {
    base.$type = filters.mediaType === 'image' ? MapMediaType.Image : MapMediaType.Video;
  }

  return base;
}

export function buildMapTimeBucketOptions(filters: FilterState, spaceId?: string): Record<string, unknown> {
  const base = applyCommonMapFilters(
    spaceId ? { spaceId } : { visibility: AssetVisibility.Timeline, withSharedSpaces: true },
    filters,
    !spaceId,
  );

  if (spaceId && filters.personIds.length > 0) {
    base.spacePersonIds = filters.personIds;
  }

  if (filters.mediaType !== 'all') {
    base.$type = filters.mediaType === 'image' ? AssetTypeEnum.Image : AssetTypeEnum.Video;
  }

  return base;
}

export function buildMapTimelineOptions(
  filters: FilterState | undefined,
  bbox: string,
  selectedClusterIds: Set<string>,
  spaceId?: string,
  settings: MapTimelineSettings = {},
): Record<string, unknown> {
  const base = applyCommonMapFilters(
    {
      bbox,
      ...(spaceId ? { spaceId } : { visibility: AssetVisibility.Timeline, withSharedSpaces: true }),
      assetFilter: selectedClusterIds,
    },
    filters ?? {
      personIds: [],
      tagIds: [],
      mediaType: 'all',
      sortOrder: 'desc',
    },
    false,
  );

  if (filters?.personIds && filters.personIds.length > 0) {
    if (spaceId) {
      base.spacePersonIds = filters.personIds;
    } else {
      base.personIds = filters.personIds;
    }
  }

  if (!spaceId) {
    const isFavorite = filters?.isFavorite ?? (settings.onlyFavorites || undefined);

    if (isFavorite !== undefined) {
      base.isFavorite = isFavorite;
    }
    if (isFavorite === undefined && settings.withPartners) {
      base.withPartners = true;
    }
  }

  if (filters?.mediaType && filters.mediaType !== 'all') {
    base.$type = filters.mediaType === 'image' ? AssetTypeEnum.Image : AssetTypeEnum.Video;
  }

  return base;
}
