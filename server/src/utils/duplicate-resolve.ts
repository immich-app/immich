import { AssetBulkUpdateDto } from 'src/dtos/asset.dto';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { DuplicateResolveSettingsDto } from 'src/dtos/duplicate.dto';
import { AssetVisibility } from 'src/enum';

/**
 * Represents the synchronized information computed from a duplicate group.
 * This mirrors the client-side getSyncedInfo function behavior.
 */
export interface SyncedInfo {
  isFavorite: boolean;
  visibility: AssetVisibility | undefined;
  rating: number;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  tagIds: string[];
}

/**
 * Result of computing the resolve policy for a duplicate group.
 */
export interface ResolvePolicy {
  /** Bulk update to apply to keeper assets */
  assetBulkUpdate: AssetBulkUpdateDto;
  /** Album IDs to add keeper assets to (if synchronizeAlbums enabled) */
  mergedAlbumIds: string[];
  /** Tag IDs to apply to keeper assets (if synchronizeTags enabled) */
  mergedTagIds: string[];
}

/**
 * Computes synchronized information from a list of assets.
 * This mirrors the client-side getSyncedInfo function in the duplicates page.
 *
 * @param assets List of assets in the duplicate group (full AssetResponseDto with exif, tags, etc.)
 * @returns Computed synced info
 */
export const getSyncedInfo = (assets: AssetResponseDto[]): SyncedInfo => {
  if (assets.length === 0) {
    return {
      isFavorite: false,
      visibility: undefined,
      rating: 0,
      description: null,
      latitude: null,
      longitude: null,
      tagIds: [],
    };
  }

  // If any of the assets is favorite, we consider the synced info as favorite
  const isFavorite = assets.some((asset) => asset.isFavorite);

  // Choose the most restrictive user-visible level (Hidden is internal-only)
  const visibilityOrder = [AssetVisibility.Locked, AssetVisibility.Archive, AssetVisibility.Timeline];
  let visibility = visibilityOrder.find((level) => assets.some((asset) => asset.visibility === level));
  if (!visibility && assets.some((asset) => asset.visibility === AssetVisibility.Hidden)) {
    visibility = AssetVisibility.Hidden;
  }

  // Choose the highest rating from the exif data of the assets
  let rating = 0;
  for (const asset of assets) {
    const assetRating = asset.exifInfo?.rating ?? 0;
    if (assetRating > rating) {
      rating = assetRating;
    }
  }

  // Concatenate unique non-empty description lines to avoid duplicates across multi-line values
  const uniqueNonEmptyLines = (values: Array<string | null | undefined>): string[] => {
    const unique = new Set<string>();
    const lines: string[] = [];
    for (const value of values) {
      if (!value) {
        continue;
      }
      for (const line of value.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || unique.has(trimmed)) {
          continue;
        }
        unique.add(trimmed);
        lines.push(trimmed);
      }
    }
    return lines;
  };
  const descriptionLines = uniqueNonEmptyLines(assets.map((asset) => asset.exifInfo?.description));
  const description = descriptionLines.length > 0 ? descriptionLines.join('\n') : null;

  // Helper: return unique numeric coordinate or null
  const getUniqueCoordinate = (key: 'latitude' | 'longitude'): number | null => {
    const values = assets
      .map((asset) => asset.exifInfo?.[key])
      .filter((value): value is number => Number.isFinite(value));

    if (values.length === 0) {
      return null;
    }

    const unique = new Set(values);
    return unique.size === 1 ? [...unique][0] : null;
  };

  const latitude = getUniqueCoordinate('latitude');
  const longitude = getUniqueCoordinate('longitude');

  // Collect all unique tag IDs from all assets
  const tagIds = [
    ...new Set(
      assets
        .flatMap((asset) => asset.tags ?? [])
        .map((tag) => tag.id)
        .filter((id): id is string => !!id),
    ),
  ];

  return { isFavorite, visibility, rating, description, latitude, longitude, tagIds };
};

/**
 * Computes the resolve policy for a duplicate group based on settings and assets.
 * This is pure domain logic with no database access.
 *
 * @param assets All assets in the duplicate group
 * @param idsToKeep Asset IDs that will be kept (derived from request)
 * @param settings Sync settings from the request
 * @param assetAlbumMap Map of asset IDs to their album IDs (only needed if synchronizeAlbums is enabled)
 * @returns The resolve policy to apply
 */
export const computeResolvePolicy = (
  assets: AssetResponseDto[],
  idsToKeep: string[],
  settings: DuplicateResolveSettingsDto,
  assetAlbumMap: Map<string, string[]> = new Map(),
): ResolvePolicy => {
  const needsSyncedInfo =
    settings.synchronizeFavorites ||
    settings.synchronizeVisibility ||
    settings.synchronizeRating ||
    settings.synchronizeDescription ||
    settings.synchronizeLocation ||
    settings.synchronizeTags;

  const syncedInfo = needsSyncedInfo ? getSyncedInfo(assets) : null;

  // Build the asset bulk update for keeper assets
  const assetBulkUpdate: AssetBulkUpdateDto = {
    ids: idsToKeep,
    duplicateId: null, // Always clear the duplicate ID
  };

  if (settings.synchronizeFavorites && syncedInfo) {
    assetBulkUpdate.isFavorite = syncedInfo.isFavorite;
  }

  if (settings.synchronizeVisibility && syncedInfo) {
    assetBulkUpdate.visibility = syncedInfo.visibility;
  }

  if (settings.synchronizeRating && syncedInfo) {
    assetBulkUpdate.rating = syncedInfo.rating;
  }

  if (settings.synchronizeDescription && syncedInfo && syncedInfo.description !== null) {
    assetBulkUpdate.description = syncedInfo.description;
  }

  // If all assets have the same location, use it; otherwise don't set it (leave as-is)
  if (settings.synchronizeLocation && syncedInfo && syncedInfo.latitude !== null && syncedInfo.longitude !== null) {
    assetBulkUpdate.latitude = syncedInfo.latitude;
    assetBulkUpdate.longitude = syncedInfo.longitude;
  }

  // Compute merged album IDs if synchronizeAlbums is enabled
  let mergedAlbumIds: string[] = [];
  if (settings.synchronizeAlbums) {
    const albumIdSet = new Set<string>();
    for (const [, albumIds] of assetAlbumMap) {
      for (const albumId of albumIds) {
        albumIdSet.add(albumId);
      }
    }
    mergedAlbumIds = [...albumIdSet];
  }

  // Merged tag IDs from synced info if synchronizeTags is enabled
  const mergedTagIds = settings.synchronizeTags && syncedInfo ? syncedInfo.tagIds : [];

  return {
    assetBulkUpdate,
    mergedAlbumIds,
    mergedTagIds,
  };
};
