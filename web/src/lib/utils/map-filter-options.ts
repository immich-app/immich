import { buildFilterContext, type FilterState } from '$lib/components/filter-panel/filter-panel';
import { AssetTypeEnum, AssetVisibility, MapMediaType } from '@immich/sdk';

function applyCommonMapFilters(base: Record<string, unknown>, filters: FilterState) {
  if (filters.personIds.length > 0) {
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
  );

  if (filters.mediaType !== 'all') {
    base.$type = filters.mediaType === 'image' ? AssetTypeEnum.Image : AssetTypeEnum.Video;
  }

  return base;
}
