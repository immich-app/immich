import type { AssetResponseDto } from '@immich/sdk';
import { fromLocalDateTime } from './timeline-util';

/**
 * Calculate thumbnail size based on number of assets and viewport width
 * @param assetCount Number of assets in the view
 * @param viewWidth viewport width
 * @returns thumbnail size
 */
export function getThumbnailSize(assetCount: number, viewWidth: number): number {
  if (assetCount < 6) {
    return Math.min(320, Math.floor(viewWidth / assetCount - assetCount));
  }

  if (viewWidth > 600) {
    return viewWidth / 7 - 7;
  }

  if (viewWidth > 400) {
    return viewWidth / 4 - 6;
  }

  if (viewWidth > 300) {
    return viewWidth / 2 - 6;
  }

  if (viewWidth > 200) {
    return viewWidth / 2 - 6;
  }

  if (viewWidth > 100) {
    return viewWidth / 1 - 6;
  }

  return 300;
}

export function getAltText(asset: AssetResponseDto) {
  if (asset.exifInfo?.description) {
    return asset.exifInfo.description;
  }

  let altText = 'Image taken';
  if (asset.exifInfo?.city && asset.exifInfo.country) {
    altText += ` in ${asset.exifInfo.city}, ${asset.exifInfo.country}`;
  }

  const names = asset.people?.filter((p) => p.name).map((p) => p.name) ?? [];
  if (names.length == 1) {
    altText += ` with ${names[0]}`;
  }
  if (names.length > 1 && names.length <= 3) {
    altText += ` with ${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
  }
  if (names.length > 3) {
    altText += ` with ${names.slice(0, 2).join(', ')}, and ${names.length - 2} others`;
  }

  const date = fromLocalDateTime(asset.localDateTime).toLocaleString({ dateStyle: 'long' });
  altText += ` on ${date}`;

  return altText;
}
