import { getExifCount } from '$lib/utils/exif-utils';
import type { AssetResponseDto } from '@immich/sdk';
import { sortBy } from 'lodash-es';

const formatPreferenceGroups: string[][] = [
  ['image/x-adobe-dng', 'image/dng', 'dng'],
  [
    'image/x-canon-cr3',
    'image/x-canon-cr2',
    'image/x-nikon-nef',
    'image/x-sony-arw',
    'image/x-olympus-orf',
    'image/x-fuji-raf',
    'image/x-panasonic-rw2',
    'image/x-panasonic-raw',
    'image/x-pentax-pef',
    'image/x-samsung-srw',
    'cr3',
    'cr2',
    'nef',
    'arw',
    'orf',
    'raf',
    'rw2',
    'raw',
    'pef',
    'srw',
  ],
  ['image/heic', 'image/heif', 'heic', 'heif'],
  ['image/avif', 'avif'],
  ['image/jpeg', 'image/jpg', 'jpeg', 'jpg'],
];

const DEFAULT_FORMAT_PRIORITY = formatPreferenceGroups.length;

const formatPriorityLookup = formatPreferenceGroups.reduce<Map<string, number>>((lookup, group, index) => {
  for (const format of group) {
    lookup.set(format, index);
  }
  return lookup;
}, new Map());

const getExtension = (path?: string) => {
  if (!path) {
    return undefined;
  }

  const index = path.lastIndexOf('.');
  if (index === -1 || index === path.length - 1) {
    return undefined;
  }

  return path.slice(index + 1).toLowerCase();
};

const getAssetFormatPriority = (asset: AssetResponseDto) => {
  const candidates = [
    asset.originalMimeType?.toLowerCase(),
    getExtension(asset.originalFileName),
    getExtension(asset.originalPath),
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const priority = formatPriorityLookup.get(candidate);
    if (priority !== undefined) {
      return priority;
    }
  }

  return DEFAULT_FORMAT_PRIORITY;
};

/**
 * Suggests the best duplicate asset to keep from a list of duplicates.
 *
 * The best asset is determined by the following criteria:
 *  - Preferred original file format (based on mime type or extension)
 *  - Largest image file size in bytes
 *  - Largest count of exif data
 *
 * @param assets List of duplicate assets
 * @returns The best asset to keep
 */
export const suggestDuplicate = (assets: AssetResponseDto[]): AssetResponseDto | undefined => {
  if (assets.length === 0) {
    return undefined;
  }

  const sorted = sortBy(assets, [
    (asset) => getAssetFormatPriority(asset),
    (asset) => -(asset.exifInfo?.fileSizeInByte ?? 0),
    (asset) => -getExifCount(asset),
  ]);

  return sorted[0];
};
