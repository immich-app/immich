import { t } from 'svelte-i18n';
import { derived, get } from 'svelte/store';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { locale } from '$lib/stores/preferences.store';
import { fromTimelinePlainDateTime } from '$lib/utils/timeline-util';

export const getAltText = derived(t, ($t) => {
  return (asset: TimelineAsset) => {
    const date = fromTimelinePlainDateTime(asset.localDateTime).toJSDate().toLocaleString(get(locale), {
      dateStyle: 'long',
      timeZone: 'UTC',
    });
    const hasPlace = asset.city && asset.country;

    const peopleCount = asset.people?.length ?? 0;
    const isVideo = asset.isVideo;

    const values = {
      date,
      city: asset.city,
      country: asset.country,
      person1: asset.people?.[0],
      person2: asset.people?.[1],
      person3: asset.people?.[2],
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
