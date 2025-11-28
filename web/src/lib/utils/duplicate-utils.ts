import {
  type DuplicateTiePreferencesSvelte,
  findDuplicateTiePreference,
} from '$lib/stores/duplicate-tie-preferences-manager.svelte';
import { getExifCount } from '$lib/utils/exif-utils';
import type { AssetResponseDto } from '@immich/sdk';

const sizeOf = (asset: AssetResponseDto) => asset.exifInfo?.fileSizeInByte ?? 0;

/**
 * Suggests the best duplicate asset to keep from a list of duplicates.
 *
 * The best asset is determined by the following criteria:
 *  - Largest image file size in bytes
 *  - Largest count of exif data
 *  - Optional source preference (internal vs external)
 *
 */
export function suggestBestDuplicate(
  assets: AssetResponseDto[],
  preference: DuplicateTiePreferencesSvelte | undefined,
): AssetResponseDto | undefined {
  if (assets.length === 0) {
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
  const maxSize = Math.max(...assets.map((asset) => sizeOf(asset)));
  const sizeFilteredAssets = assets.filter((assets) => sizeOf(assets) === maxSize);

  const maxExif = Math.max(...sizeFilteredAssets.map((asset) => getExifCount(asset)));
  return sizeFilteredAssets.filter((assets) => getExifCount(assets) === maxExif);
};

const filterBySource = (assets: AssetResponseDto[], priority: 'internal' | 'external'): AssetResponseDto[] => {
  const filtered = assets.filter((asset) => (priority === 'external') === !!asset.libraryId);
  return filtered.length > 0 ? filtered : assets;
};
