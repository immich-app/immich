import { locale } from '$lib/stores/preferences.store';
import { AssetTypeEnum, type AssetResponseDto } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { derived, get } from 'svelte/store';
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

    const date = fromLocalDateTime(asset.localDateTime).toLocaleString({ dateStyle: 'long' }, { locale: get(locale) });
    const hasPlace = !!asset.exifInfo?.city && !!asset.exifInfo?.country;
    const names = asset.people?.filter((p) => p.name).map((p) => p.name) ?? [];
    const peopleCount = names.length;
    const isVideo = asset.type === AssetTypeEnum.Video;

    const values = {
      date,
      city: asset.exifInfo?.city,
      country: asset.exifInfo?.country,
      person1: names[0],
      person2: names[1],
      person3: names[2],
      isVideo,
      additionalCount: peopleCount > 3 ? peopleCount - 2 : 0,
    };

    if (peopleCount > 0) {
      switch (peopleCount) {
        case 1: {
          return hasPlace
            ? $t('image_alt_text_date_place_1_person', { values })
            : $t('image_alt_text_date_1_person', { values });
        }
        case 2: {
          return hasPlace
            ? $t('image_alt_text_date_place_2_people', { values })
            : $t('image_alt_text_date_2_people', { values });
        }
        case 3: {
          return hasPlace
            ? $t('image_alt_text_date_place_3_people', { values })
            : $t('image_alt_text_date_3_people', { values });
        }
        default: {
          return hasPlace
            ? $t('image_alt_text_date_place_4_or_more_people', { values })
            : $t('image_alt_text_date_4_or_more_people', { values });
        }
      }
    }

    if (hasPlace) {
      return $t('image_alt_text_date_place', { values });
    }

    return $t('image_alt_text_date', { values });
  };
});
