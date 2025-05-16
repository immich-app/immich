import type { TimelineAsset } from '$lib/stores/assets-store.svelte';
import { locale } from '$lib/stores/preferences.store';
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
  return (asset: TimelineAsset) => {
    const date = fromLocalDateTime(asset.localDateTime).toLocaleString({ dateStyle: 'long' }, { locale: get(locale) });
    const hasPlace = asset.city && asset.country;

    const peopleCount = asset.people.length;
    const isVideo = asset.isVideo;

    const values = {
      date,
      city: asset.city,
      country: asset.country,
      person1: asset.people.at(0),
      person2: asset.people.at(1),
      person3: asset.people.at(2),
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
