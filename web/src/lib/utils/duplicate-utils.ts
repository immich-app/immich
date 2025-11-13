import {
  type DuplicateTiePreferencesSvelte,
  findDuplicateTiePreference,
} from '$lib/stores/duplicate-tie-preferences.svelte';
import { getExifCount } from '$lib/utils/exif-utils';
import type { AssetResponseDto } from '@immich/sdk';

const sizeOf = (asset: AssetResponseDto) => asset.exifInfo?.fileSizeInByte ?? 0;
const isExternal = (asset: AssetResponseDto) => Boolean(asset.libraryId);

/**
 * Suggests the best duplicate asset to keep from a list of duplicates.
 *
 * The best asset is determined by the following criteria:
 *  - Largest image file size in bytes
 *  - Largest count of exif data
 *  - Optional source preference (internal vs external)
 *
 * @param assets List of duplicate assets
 * @param preference Preference for selecting duplicates
 * @returns The best asset to keep
 *
 */
export function suggestBestDuplicate(
  assets: AssetResponseDto[],
  preference: DuplicateTiePreferencesSvelte | undefined,
): AssetResponseDto | undefined {
  if (!assets.length) {
    return;
  }
  let candidates = filterBySizeAndExif(assets);

  const source = findDuplicateTiePreference(preference, 'source');
  if (source && candidates.length > 1) {
    candidates = filterBySource(candidates, source.priority);
  }
  return candidates[0];
}

const filterBySizeAndExif = (assets: AssetResponseDto[]): AssetResponseDto[] => {
  const maxSize = Math.max(...assets.map(sizeOf));
  const sizeFiltered = assets.filter((assets) => sizeOf(assets) === maxSize);

  const maxExif = Math.max(...sizeFiltered.map(getExifCount));
  return sizeFiltered.filter((assets) => getExifCount(assets) === maxExif);
};

const filterBySource = (assets: AssetResponseDto[], priority: 'internal' | 'external'): AssetResponseDto[] => {
  const filtered = assets.filter((asset) => (priority === 'external') === !!asset.libraryId);
  return filtered.length > 0 ? filtered : assets;
};
