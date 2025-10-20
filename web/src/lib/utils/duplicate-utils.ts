import { type DuplicateTiePreferences, findDuplicateTiePreference } from '$lib/stores/duplicate-tie-preferences';
import { getExifCount } from '$lib/utils/exif-utils';
import type { AssetResponseDto } from '@immich/sdk';

const sizeOf = (asset: AssetResponseDto) => asset.exifInfo?.fileSizeInByte ?? 0;
const isExternal = (asset: AssetResponseDto) => Boolean(asset.libraryId);

export class DuplicateSelection {
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
  public suggestDuplicate = (
    assets: AssetResponseDto[],
    preference: DuplicateTiePreferences | undefined,
  ): AssetResponseDto | undefined => {
    if (!assets.length) return;

    // first filter by size and exif count
    let candidates = this.filterBySizeAndExif(assets);

    // then filter by source preference if available
    const source = findDuplicateTiePreference(preference, 'source');
    if (source && candidates.length > 1) {
      candidates = this.filterBySource(candidates, source.priority);
    }

    // Return the best assets
    return candidates[0];
  };

  private filterBySizeAndExif(assets: AssetResponseDto[]): AssetResponseDto[] {
    const maxSize = Math.max(...assets.map(sizeOf));
    const sizeFiltered = assets.filter((assets) => sizeOf(assets) === maxSize);

    const maxExif = Math.max(...sizeFiltered.map(getExifCount));
    return sizeFiltered.filter((assets) => getExifCount(assets) === maxExif);
  }

  private filterBySource(assets: AssetResponseDto[], priority: 'internal' | 'external'): AssetResponseDto[] {
    const filtered = assets.filter((assets) => {
      if (priority == 'external') {
        return isExternal(assets);
      } else {
        return !isExternal(assets);
      }
    });
    if (filtered.length > 0) {
      return filtered;
    } else {
      return assets;
    }
  }
}
