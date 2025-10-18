import type { TiePreference } from '$lib/stores/duplicate-preferences';
import { applyLibraryTieBreaker, selectDefaultByCurrentHeuristic } from '$lib/utils/duplicate-selection';
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
  let duplicateAssets = sortBy(assets, (assets) => assets.exifInfo?.fileSizeInByte ?? 0);
  duplicateAssets = duplicateAssets.filter(
    (assets) => assets.exifInfo?.fileSizeInByte === duplicateAssets.at(-1)?.exifInfo?.fileSizeInByte,
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
  preference: TiePreference,
): AssetResponseDto | undefined => {
  const base = suggestDuplicate(assets) ?? selectDefaultByCurrentHeuristic(assets);
  return applyLibraryTieBreaker(assets, base, preference);
};

export const buildKeepSelectionForGroup = (
  group: AssetResponseDto[],
  preference: TiePreference,
): { id: string; action: 'keep' | 'trash' }[] => {
  const keep = suggestDuplicateWithPrefs(group, preference) ?? group[0];
  return group.map((assets) => ({ id: assets.id, action: assets.id === keep.id ? 'keep' : 'trash' }));
};

export const buildKeepSelectionForAll = (
  groups: AssetResponseDto[][],
  preference: TiePreference,
): { id: string; action: 'keep' | 'trash' }[] => {
  return groups.flatMap((groups) => buildKeepSelectionForGroup(groups, preference));
};
