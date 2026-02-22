import type { MetadataPreference } from '$lib/stores/duplicates-metadata.store';
import { getAssetResolution, getFileSize } from '$lib/utils/asset-utils';
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


export function normalizeForComparison(
  key: keyof MetadataPreference,
  value: string | number | boolean | null | undefined,
): string | number | boolean | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  if (key === 'fileCreatedAt' || key === 'fileModifiedAt' || key === 'dateTimeOriginal' || key === 'modifyDate') {
    const s = String(value);
    const m = s.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
    return m ? m[1] : s;
  }

  if (key === 'fNumber' && typeof value === 'number') {
    return Number(value.toFixed(1));
  }
  if ((key === 'latitude' || key === 'longitude') && typeof value === 'number') {
    return Number(value.toFixed(4));
  }
  if (key === 'focalLength' && typeof value === 'number') {
    return Number(value.toFixed(2));
  }

  return value;
}

export type DifferingMetadataFields = {
  [key in keyof MetadataPreference]?: boolean;
};

// Helper function to get the value of a metadata field for an asset for comparison purposes only.
function getValueForAsset(
  asset: AssetResponseDto,
  key: keyof MetadataPreference,
): string | number | boolean | null | undefined {
  switch (key) {
    case 'fileCreatedAt':
    case 'fileModifiedAt':
    case 'originalFileName':
    case 'originalPath': {
      return asset[key];
    }
    case 'fileSize': {
      return getFileSize(asset);
    }
    case 'resolution': {
      return getAssetResolution(asset);
    }
    default: {
      if (asset.exifInfo && key in asset.exifInfo) {
        return asset.exifInfo[key as keyof typeof asset.exifInfo];
      }
      return undefined;
    }
  }
}

// Helper function to exclude fields that have no value across all assets, even if they are selected in the metadata preferences.
function hasAnyValue(assets: AssetResponseDto[], key: keyof MetadataPreference): boolean {
  return assets.some((asset) => {
    const value = getValueForAsset(asset, key);
    return value !== null && value !== undefined;
  });
}

// Computes which metadata fields differ across a list of assets based on the user's selected metadata preferences and whether to show all metadata or only differing metadata.
export function computeDifferingMetadataFields(
  assets: AssetResponseDto[],
  selectedMetadataFields: MetadataPreference,
  showAllMetadata: boolean,
): DifferingMetadataFields {
  const diffs: DifferingMetadataFields = {};

  if (showAllMetadata) {
    for (const key in selectedMetadataFields) {
      const metaKey = key as keyof MetadataPreference;
      if (selectedMetadataFields[metaKey] && hasAnyValue(assets, metaKey)) {
        diffs[metaKey] = true;
      }
    }
    return diffs;
  }

  for (const key in selectedMetadataFields) {
    const metaKey = key as keyof MetadataPreference;
    if (!selectedMetadataFields[metaKey]) {
      continue;
    }

    const uniqueValues = new Set<string | number | boolean | null | undefined>();

    for (const asset of assets) {
      const value = getValueForAsset(asset, metaKey);
      if (value !== undefined && value !== null) {
        uniqueValues.add(normalizeForComparison(metaKey, value));
      }
    }

    if (uniqueValues.size > 1) {
      diffs[metaKey] = true;
    }
  }

  return diffs;
}