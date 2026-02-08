import { AssetResponseDto } from 'src/dtos/asset-response.dto';

/**
 * Counts all truthy values in the exifInfo object.
 * This matches the client implementation in web/src/lib/utils/exif-utils.ts
 *
 * @param asset Asset with optional exifInfo
 * @returns Count of truthy EXIF values
 */
export const getExifCount = (asset: AssetResponseDto): number => {
  return Object.values(asset.exifInfo ?? {}).filter(Boolean).length;
};

/**
 * Suggests the best duplicate asset to keep from a list of duplicates.
 * This is a direct port of the client logic from web/src/lib/utils/duplicate-utils.ts
 *
 * The best asset is determined by the following criteria:
 *  1. Largest image file size in bytes
 *  2. Largest count of EXIF data (as tie-breaker)
 *
 * @param assets List of duplicate assets
 * @returns The best asset to keep, or undefined if empty list
 */
export const suggestDuplicate = (assets: AssetResponseDto[]): AssetResponseDto | undefined => {
  if (assets.length === 0) {
    return undefined;
  }

  // Sort by file size ascending (smallest first)
  let duplicateAssets = [...assets].toSorted(
    (a, b) => (a.exifInfo?.fileSizeInByte ?? 0) - (b.exifInfo?.fileSizeInByte ?? 0),
  );

  // Get the largest file size (last element after sorting)
  const largestFileSize = duplicateAssets.at(-1)?.exifInfo?.fileSizeInByte ?? 0;

  // Filter to keep only assets with the largest file size
  duplicateAssets = duplicateAssets.filter((asset) => (asset.exifInfo?.fileSizeInByte ?? 0) === largestFileSize);

  // If there are multiple assets with the same file size, sort by EXIF count
  if (duplicateAssets.length >= 2) {
    duplicateAssets = duplicateAssets.toSorted((a, b) => getExifCount(a) - getExifCount(b));
  }

  // Return the last asset (highest EXIF count among highest file size)
  return duplicateAssets.at(-1);
};

/**
 * Suggests the best duplicate asset IDs to keep from a list of duplicates.
 * Returns an array with a single asset ID (the best candidate), or empty if no assets.
 *
 * @param assets List of duplicate assets
 * @returns Array of suggested asset IDs to keep (0 or 1 element)
 */
export const suggestDuplicateKeepAssetIds = (assets: AssetResponseDto[]): string[] => {
  const suggested = suggestDuplicate(assets);
  return suggested ? [suggested.id] : [];
};
