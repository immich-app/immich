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

/* ---------------------------- Duplicate diffing --------------------------- */

// All metadata field keys checked for differences, in display order
export const METADATA_FIELD_KEYS = [
  'originalFileName',
  'originalPath',
  'fileSize',
  'resolution',
  'fileCreatedAt',
  'fileModifiedAt',
  'dateTimeOriginal',
  'timeZone',
  'modifyDate',
  'city',
  'state',
  'country',
  'latitude',
  'longitude',
  'make',
  'model',
  'lensModel',
  'fNumber',
  'focalLength',
  'iso',
  'exposureTime',
  'description',
  'rating',
  'orientation',
  'projectionType',
] as const;

export type MetadataFieldKey = (typeof METADATA_FIELD_KEYS)[number];
export type DifferingMetadataFields = Partial<Record<MetadataFieldKey, boolean>>;

export function normalizeForComparison(
  key: MetadataFieldKey,
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

// Helper function to get the value of a metadata field for an asset for comparison purposes only.
function getValueForAsset(
  asset: AssetResponseDto,
  key: MetadataFieldKey,
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

// Helper function to exclude fields that have no value across all assets.
function hasAnyValue(assets: AssetResponseDto[], key: MetadataFieldKey): boolean {
  return assets.some((asset) => {
    const value = getValueForAsset(asset, key);
    return value !== null && value !== undefined;
  });
}

// Computes which metadata fields differ across a list of assets.
export function computeDifferingMetadataFields(assets: AssetResponseDto[]): DifferingMetadataFields {
  const diffs: DifferingMetadataFields = {};

  for (const key of METADATA_FIELD_KEYS) {
    if (!hasAnyValue(assets, key)) {
      continue;
    }

    const uniqueValues = new Set<string | number | boolean | null | undefined>();

    for (const asset of assets) {
      const value = getValueForAsset(asset, key);
      if (value !== undefined && value !== null) {
        uniqueValues.add(normalizeForComparison(key, value));
      }
    }

    if (uniqueValues.size > 1) {
      diffs[key] = true;
    }
  }

  return diffs;
}