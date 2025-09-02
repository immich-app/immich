import { applyExternalTieBreaker, selectDefaultByCurrentHeuristic } from '$lib/utils/duplicate-selection';
import { getExifCount } from '$lib/utils/exif-utils';
import type { AssetResponseDto } from '@immich/sdk';
import { sortBy } from 'lodash-es';

/**
 * Suggests the best duplicate asset to keep from a list of duplicates.
 *
 * The best asset is determined by the following criteria:
 *  - Largest image file size in bytes
 *  - Largest count of exif data
 *
 * @param assets List of duplicate assets
 * @returns The best asset to keep
 */
export const suggestDuplicate = (assets: AssetResponseDto[]): AssetResponseDto | undefined => {
  let duplicateAssets = sortBy(assets, (asset) => asset.exifInfo?.fileSizeInByte ?? 0);

  // Update the list to only include assets with the largest file size
  duplicateAssets = duplicateAssets.filter(
    (asset) => asset.exifInfo?.fileSizeInByte === duplicateAssets.at(-1)?.exifInfo?.fileSizeInByte,
  );

  // If there are multiple assets with the same file size, sort the list by the count of exif data
  if (duplicateAssets.length >= 2) {
    duplicateAssets = sortBy(duplicateAssets, getExifCount);
  }

  // Return the last asset in the list
  return duplicateAssets.pop();
};

export const suggestDuplicateWithPrefs = (
  assets: AssetResponseDto[],
  preferExternal: boolean,
): AssetResponseDto | undefined => {
  const base = suggestDuplicate(assets) ?? selectDefaultByCurrentHeuristic(assets);
  return applyExternalTieBreaker(assets, base, preferExternal);
};

export const buildKeepSelectionForGroup = (
  group: AssetResponseDto[],
  preferExternal: boolean,
): { id: string; action: 'keep' | 'trash' }[] => {
  const keep = suggestDuplicateWithPrefs(group, preferExternal) ?? group[0];
  return group.map((a) => ({ id: a.id, action: a.id === keep.id ? 'keep' : 'trash' }));
};

export const buildKeepSelectionForAll = (
  groups: AssetResponseDto[][],
  preferExternal: boolean,
): { id: string; action: 'keep' | 'trash' }[] => {
  return groups.flatMap((g) => buildKeepSelectionForGroup(g, preferExternal));
};
