import type { DuplicateTiePreferencesSvelte } from '$lib/stores/duplicate-tie-preferences-manager.svelte';
import { findDuplicateTiePreference } from '$lib/stores/duplicate-tie-preferences-manager.svelte';
import { getExifCount } from '$lib/utils/exif-utils';
import type { AssetResponseDto } from '@immich/sdk';

const getFileSize = (asset: AssetResponseDto) => asset.exifInfo?.fileSizeInByte ?? 0;

const getTopCandidates = (assets: AssetResponseDto[]): AssetResponseDto[] => {
  if (assets.length === 0) {
    return [];
  }

  const largestFileSize = Math.max(...assets.map((asset) => getFileSize(asset)));
  const sameSizeAssets = assets.filter((asset) => getFileSize(asset) === largestFileSize);
  const maxExifCount = Math.max(...sameSizeAssets.map((asset) => getExifCount(asset)));

  return sameSizeAssets.filter((asset) => getExifCount(asset) === maxExifCount);
};

const filterBySource = (assets: AssetResponseDto[], priority: 'internal' | 'external'): AssetResponseDto[] => {
  const filtered = assets.filter((asset) => (priority === 'external') === Boolean(asset.libraryId));
  return filtered.length > 0 ? filtered : assets;
};

export const suggestBestDuplicate = (
  assets: AssetResponseDto[],
  preference: DuplicateTiePreferencesSvelte | undefined,
): AssetResponseDto | undefined => {
  let candidates = getTopCandidates(assets);

  const sourcePreference = findDuplicateTiePreference(preference, 'source');
  if (sourcePreference && candidates.length > 1) {
    candidates = filterBySource(candidates, sourcePreference.priority);
  }

  return candidates.at(-1);
};

export const suggestBestDuplicateKeepAssetIds = (
  assets: AssetResponseDto[],
  preference: DuplicateTiePreferencesSvelte | undefined,
): string[] => {
  const suggested = suggestBestDuplicate(assets, preference);
  return suggested ? [suggested.id] : [];
};
