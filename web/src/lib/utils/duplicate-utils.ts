import type { AssetResponseDto } from '@immich/sdk';
import { sortBy } from 'lodash-es';
import { getExifCount } from '$lib/utils/exif-utils';

/**
 * Suggests the best duplicate asset to keep from a list of duplicates.
 *
 * The best asset is determined by the following criteria:
 *  - The asset with the largest file size
 *  - If there are multiple assets with the same file size, the asset with the most exif data
 *
 * @param assets List of duplicate assets
 * @returns The best asset to keep
 */
export const suggestDuplicate = (assets: AssetResponseDto[]): AssetResponseDto | undefined => {
  const assetsBySize = sortBy(assets, (asset) => asset.exifInfo?.fileSizeInByte ?? 0);

  // All assets with the same file size as the largest asset
  const highestSizeAssets = assetsBySize.filter((asset) => asset.exifInfo?.fileSizeInByte === assetsBySize.at(-1)?.exifInfo?.fileSizeInByte);

  // If there are multiple assets with the same file size, return the one with the most exif data
  if(highestSizeAssets.length >= 2) {
    const assetsByExifCount = sortBy(highestSizeAssets, getExifCount);
    return assetsByExifCount.pop();
  }

  // Return the asset with the largest file size
  return assetsBySize.pop();
};
