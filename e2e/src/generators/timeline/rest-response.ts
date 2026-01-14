/**
 * REST API output functions for converting timeline data to API response formats
 */

import {
  AssetTypeEnum,
  AssetVisibility,
  UserAvatarColor,
  type AlbumResponseDto,
  type AssetResponseDto,
  type ExifResponseDto,
  type TimeBucketAssetResponseDto,
  type TimeBucketsResponseDto,
  type UserResponseDto,
} from '@immich/sdk';
import { DateTime } from 'luxon';
import { signupDto } from 'src/fixtures';
import { parseTimeBucketKey } from 'src/generators/timeline/utils';
import type { MockTimelineAsset, MockTimelineData } from './timeline-config';

/**
 * Convert timeline/asset models to columnar format (parallel arrays)
 */
export function toColumnarFormat(assets: MockTimelineAsset[]): TimeBucketAssetResponseDto {
  const result: TimeBucketAssetResponseDto = {
    id: [],
    ownerId: [],
    ratio: [],
    thumbhash: [],
    fileCreatedAt: [],
    localOffsetHours: [],
    isFavorite: [],
    isTrashed: [],
    isImage: [],
    duration: [],
    projectionType: [],
    livePhotoVideoId: [],
    city: [],
    country: [],
    visibility: [],
  };

  for (const asset of assets) {
    result.id.push(asset.id);
    result.ownerId.push(asset.ownerId);
    result.ratio.push(asset.ratio);
    result.thumbhash.push(asset.thumbhash);
    result.fileCreatedAt.push(asset.fileCreatedAt);
    result.localOffsetHours.push(0); // Assuming UTC for mocks
    result.isFavorite.push(asset.isFavorite);
    result.isTrashed.push(asset.isTrashed);
    result.isImage.push(asset.isImage);
    result.duration.push(asset.duration);
    result.projectionType.push(asset.projectionType);
    result.livePhotoVideoId.push(asset.livePhotoVideoId);
    result.city.push(asset.city);
    result.country.push(asset.country);
    result.visibility.push(asset.visibility);
  }

  if (assets.some((a) => a.latitude !== null || a.longitude !== null)) {
    result.latitude = assets.map((a) => a.latitude);
    result.longitude = assets.map((a) => a.longitude);
  }

  result.stack = assets.map(() => null);
  return result;
}

/**
 * Extract a single bucket from timeline data (mimics getTimeBucket API)
 * Automatically handles both ISO timestamp and simple month formats
 * Returns data in columnar format matching the actual API
 * When albumId is provided, only returns assets from that album
 */
export function getTimeBucket(
  timelineData: MockTimelineData,
  timeBucket: string,
  isTrashed: boolean | undefined,
  isArchived: boolean | undefined,
  isFavorite: boolean | undefined,
  albumId: string | undefined,
  changes: Changes,
): TimeBucketAssetResponseDto {
  const bucketKey = parseTimeBucketKey(timeBucket);
  let assets = timelineData.buckets.get(bucketKey);

  if (!assets) {
    return toColumnarFormat([]);
  }

  // Create sets for quick lookups
  const deletedAssetIds = new Set(changes.assetDeletions);
  const archivedAssetIds = new Set(changes.assetArchivals);
  const favoritedAssetIds = new Set(changes.assetFavorites);

  // Filter assets based on trashed/archived status
  assets = assets.filter((asset) =>
    shouldIncludeAsset(asset, isTrashed, isArchived, isFavorite, deletedAssetIds, archivedAssetIds, favoritedAssetIds),
  );

  // Filter to only include assets from the specified album
  if (albumId) {
    const album = timelineData.album;
    if (!album || album.id !== albumId) {
      return toColumnarFormat([]);
    }

    // Create a Set for faster lookup
    const albumAssetIds = new Set([...album.assetIds, ...changes.albumAdditions]);
    assets = assets.filter((asset) => albumAssetIds.has(asset.id));
  }

  // Override properties for assets in changes arrays
  const assetsWithOverrides = assets.map((asset) => {
    if (deletedAssetIds.has(asset.id) || archivedAssetIds.has(asset.id) || favoritedAssetIds.has(asset.id)) {
      return {
        ...asset,
        isFavorite: favoritedAssetIds.has(asset.id) ? true : asset.isFavorite,
        isTrashed: deletedAssetIds.has(asset.id) ? true : asset.isTrashed,
        visibility: archivedAssetIds.has(asset.id) ? AssetVisibility.Archive : asset.visibility,
      };
    }
    return asset;
  });

  return toColumnarFormat(assetsWithOverrides);
}

export type Changes = {
  // ids of assets that are newly added to the album
  albumAdditions: string[];
  // ids of assets that are newly deleted
  assetDeletions: string[];
  // ids of assets that are newly archived
  assetArchivals: string[];
  // ids of assets that are newly favorited
  assetFavorites: string[];
};

/**
 * Helper function to determine if an asset should be included based on filter criteria
 * @param asset - The asset to check
 * @param isTrashed - Filter for trashed status (undefined means no filter)
 * @param isArchived - Filter for archived status (undefined means no filter)
 * @param isFavorite - Filter for favorite status (undefined means no filter)
 * @param deletedAssetIds - Set of IDs for assets that have been deleted
 * @param archivedAssetIds - Set of IDs for assets that have been archived
 * @param favoritedAssetIds - Set of IDs for assets that have been favorited
 * @returns true if the asset matches all filter criteria
 */
function shouldIncludeAsset(
  asset: MockTimelineAsset,
  isTrashed: boolean | undefined,
  isArchived: boolean | undefined,
  isFavorite: boolean | undefined,
  deletedAssetIds: Set<string>,
  archivedAssetIds: Set<string>,
  favoritedAssetIds: Set<string>,
): boolean {
  // Determine actual status (property or in changes)
  const actuallyTrashed = asset.isTrashed || deletedAssetIds.has(asset.id);
  const actuallyArchived = asset.visibility === 'archive' || archivedAssetIds.has(asset.id);
  const actuallyFavorited = asset.isFavorite || favoritedAssetIds.has(asset.id);

  // Apply filters
  if (isTrashed !== undefined && actuallyTrashed !== isTrashed) {
    return false;
  }
  if (isArchived !== undefined && actuallyArchived !== isArchived) {
    return false;
  }
  if (isFavorite !== undefined && actuallyFavorited !== isFavorite) {
    return false;
  }

  return true;
}
/**
 * Get summary for all buckets (mimics getTimeBuckets API)
 * When albumId is provided, only includes buckets that contain assets from that album
 */
export function getTimeBuckets(
  timelineData: MockTimelineData,
  isTrashed: boolean | undefined,
  isArchived: boolean | undefined,
  isFavorite: boolean | undefined,
  albumId: string | undefined,
  changes: Changes,
): TimeBucketsResponseDto[] {
  const summary: TimeBucketsResponseDto[] = [];

  // Create sets for quick lookups
  const deletedAssetIds = new Set(changes.assetDeletions);
  const archivedAssetIds = new Set(changes.assetArchivals);
  const favoritedAssetIds = new Set(changes.assetFavorites);

  // If no albumId is specified, return summary for all assets
  if (albumId) {
    // Filter to only include buckets with assets from the specified album
    const album = timelineData.album;
    if (!album || album.id !== albumId) {
      return [];
    }

    // Create a Set for faster lookup
    const albumAssetIds = new Set([...album.assetIds, ...changes.albumAdditions]);
    for (const removed of changes.assetDeletions) {
      albumAssetIds.delete(removed);
    }
    for (const [bucketKey, assets] of timelineData.buckets) {
      // Count how many assets in this bucket are in the album and match trashed/archived filters
      const albumAssetsInBucket = assets.filter((asset) => {
        // Must be in the album
        if (!albumAssetIds.has(asset.id)) {
          return false;
        }

        return shouldIncludeAsset(
          asset,
          isTrashed,
          isArchived,
          isFavorite,
          deletedAssetIds,
          archivedAssetIds,
          favoritedAssetIds,
        );
      });

      if (albumAssetsInBucket.length > 0) {
        summary.push({
          timeBucket: bucketKey,
          count: albumAssetsInBucket.length,
        });
      }
    }
  } else {
    for (const [bucketKey, assets] of timelineData.buckets) {
      // Filter assets based on trashed/archived status
      const filteredAssets = assets.filter((asset) =>
        shouldIncludeAsset(
          asset,
          isTrashed,
          isArchived,
          isFavorite,
          deletedAssetIds,
          archivedAssetIds,
          favoritedAssetIds,
        ),
      );

      if (filteredAssets.length > 0) {
        summary.push({
          timeBucket: bucketKey,
          count: filteredAssets.length,
        });
      }
    }
  }

  // Sort summary by date (newest first) using luxon
  summary.sort((a, b) => {
    const dateA = DateTime.fromISO(a.timeBucket);
    const dateB = DateTime.fromISO(b.timeBucket);
    return dateB.diff(dateA).milliseconds;
  });

  return summary;
}

const createDefaultOwner = (ownerId: string) => {
  const defaultOwner: UserResponseDto = {
    id: ownerId,
    email: signupDto.admin.email,
    name: signupDto.admin.name,
    profileImagePath: '',
    profileChangedAt: new Date().toISOString(),
    avatarColor: UserAvatarColor.Blue,
  };
  return defaultOwner;
};

/**
 * Convert a TimelineAssetConfig to a full AssetResponseDto
 * This matches the response from GET /api/assets/:id
 */
export function toAssetResponseDto(asset: MockTimelineAsset, owner?: UserResponseDto): AssetResponseDto {
  const now = new Date().toISOString();

  // Default owner if not provided
  const defaultOwner = createDefaultOwner(asset.ownerId);

  const exifInfo: ExifResponseDto = {
    make: null,
    model: null,
    exifImageWidth: asset.ratio > 1 ? 4000 : 3000,
    exifImageHeight: asset.ratio > 1 ? Math.round(4000 / asset.ratio) : Math.round(3000 * asset.ratio),
    fileSizeInByte: asset.fileSizeInByte,
    orientation: '1',
    dateTimeOriginal: asset.fileCreatedAt,
    modifyDate: asset.fileCreatedAt,
    timeZone: asset.latitude === null ? null : 'UTC',
    lensModel: null,
    fNumber: null,
    focalLength: null,
    iso: null,
    exposureTime: null,
    latitude: asset.latitude,
    longitude: asset.longitude,
    city: asset.city,
    country: asset.country,
    state: null,
    description: null,
  };

  return {
    id: asset.id,
    deviceAssetId: `device-${asset.id}`,
    ownerId: asset.ownerId,
    owner: owner || defaultOwner,
    libraryId: `library-${asset.ownerId}`,
    deviceId: `device-${asset.ownerId}`,
    type: asset.isVideo ? AssetTypeEnum.Video : AssetTypeEnum.Image,
    originalPath: `/original/${asset.id}.${asset.isVideo ? 'mp4' : 'jpg'}`,
    originalFileName: `${asset.id}.${asset.isVideo ? 'mp4' : 'jpg'}`,
    originalMimeType: asset.isVideo ? 'video/mp4' : 'image/jpeg',
    thumbhash: asset.thumbhash,
    fileCreatedAt: asset.fileCreatedAt,
    fileModifiedAt: asset.fileCreatedAt,
    localDateTime: asset.localDateTime,
    updatedAt: now,
    createdAt: asset.fileCreatedAt,
    isFavorite: asset.isFavorite,
    isArchived: false,
    isTrashed: asset.isTrashed,
    visibility: asset.visibility,
    duration: asset.duration || '0:00:00.00000',
    exifInfo,
    livePhotoVideoId: asset.livePhotoVideoId,
    tags: [],
    people: [],
    unassignedFaces: [],
    stack: asset.stack,
    isOffline: false,
    hasMetadata: true,
    duplicateId: null,
    resized: true,
    checksum: asset.checksum,
    width: exifInfo.exifImageWidth ?? 1,
    height: exifInfo.exifImageHeight ?? 1,
  };
}

/**
 * Get a single asset by ID from timeline data
 * This matches the response from GET /api/assets/:id
 */
export function getAsset(
  timelineData: MockTimelineData,
  assetId: string,
  owner?: UserResponseDto,
): AssetResponseDto | undefined {
  // Search through all buckets for the asset
  const buckets = [...timelineData.buckets.values()];
  for (const assets of buckets) {
    const asset = assets.find((a) => a.id === assetId);
    if (asset) {
      return toAssetResponseDto(asset, owner);
    }
  }
  return undefined;
}

/**
 * Get a mock album from timeline data
 * This matches the response from GET /api/albums/:id
 */
export function getAlbum(
  timelineData: MockTimelineData,
  ownerId: string,
  albumId: string | undefined,
  changes: Changes,
): AlbumResponseDto | undefined {
  if (!timelineData.album) {
    return undefined;
  }

  // If albumId is provided and doesn't match, return undefined
  if (albumId && albumId !== timelineData.album.id) {
    return undefined;
  }

  const album = timelineData.album;
  const albumOwner = createDefaultOwner(ownerId);

  // Get the actual asset objects from the timeline data
  const albumAssets: AssetResponseDto[] = [];
  const allAssets = [...timelineData.buckets.values()].flat();

  for (const assetId of album.assetIds) {
    const assetConfig = allAssets.find((a) => a.id === assetId);
    if (assetConfig) {
      albumAssets.push(toAssetResponseDto(assetConfig, albumOwner));
    }
  }
  for (const assetId of changes.albumAdditions ?? []) {
    const assetConfig = allAssets.find((a) => a.id === assetId);
    if (assetConfig) {
      albumAssets.push(toAssetResponseDto(assetConfig, albumOwner));
    }
  }

  albumAssets.sort((a, b) => DateTime.fromISO(b.localDateTime).diff(DateTime.fromISO(a.localDateTime)).milliseconds);

  // For a basic mock album, we don't include any albumUsers (shared users)
  // The owner is represented by the owner field, not in albumUsers
  const response: AlbumResponseDto = {
    id: album.id,
    albumName: album.albumName,
    description: album.description,
    albumThumbnailAssetId: album.thumbnailAssetId,
    createdAt: album.createdAt,
    updatedAt: album.updatedAt,
    ownerId: albumOwner.id,
    owner: albumOwner,
    albumUsers: [], // Empty array for non-shared album
    shared: false,
    hasSharedLink: false,
    isActivityEnabled: true,
    assetCount: albumAssets.length,
    assets: albumAssets,
    startDate: albumAssets.length > 0 ? albumAssets.at(-1)?.fileCreatedAt : undefined,
    endDate: albumAssets.length > 0 ? albumAssets[0].fileCreatedAt : undefined,
    lastModifiedAssetTimestamp: albumAssets.length > 0 ? albumAssets[0].fileCreatedAt : undefined,
  };

  return response;
}
