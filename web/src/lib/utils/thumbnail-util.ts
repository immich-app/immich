import { AssetTypeEnum, type AssetResponseDto } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { derived } from 'svelte/store';
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

export const getAltText = derived(t, ($t) => {
  return (asset: AssetResponseDto) => {
    if (asset.exifInfo?.description) {
      return asset.exifInfo.description;
    }

    let altText = $t('image_taken', { values: { isVideo: asset.type === AssetTypeEnum.Video } });

    if (asset.exifInfo?.city && asset.exifInfo?.country) {
      const placeText = $t('image_alt_text_place', {
        values: { city: asset.exifInfo.city, country: asset.exifInfo.country },
      });
      altText += ` ${placeText}`;
    }

    const names = asset.people?.filter((p) => p.name).map((p) => p.name) ?? [];
    if (names.length > 0) {
      const namesText = $t('image_alt_text_people', {
        values: {
          count: names.length,
          person1: names[0],
          person2: names[1],
          person3: names[2],
          others: names.length > 3 ? names.length - 2 : 0,
        },
      });
      altText += ` ${namesText}`;
    }

    const date = fromLocalDateTime(asset.localDateTime).toLocaleString({ dateStyle: 'long' });
    const dateText = $t('image_alt_text_date', { values: { date } });
    altText += ` ${dateText}`;

    return altText;
  };
});
