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

    const date = fromLocalDateTime(asset.localDateTime).toLocaleString({ dateStyle: 'long' });
    const hasLocation = asset.exifInfo?.city && asset.exifInfo?.country;
    const names = asset.people?.filter((p) => p.name).map((p) => p.name) ?? [];
    const peopleCount = names.length;
    const isVideo = asset.type === AssetTypeEnum.Video;

    let key = 'image_alt_text_date';
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

    if (hasLocation) {
      key += '_place';
    }

    if (peopleCount > 0) {
      key += getPersonSuffix(peopleCount);
    }

    return $t(key, { values });
  };
});

const getPersonSuffix = (count: number) => {
  if (count === 1) {
    return '_1_person';
  }

  if (count === 2 || count === 3) {
    return `_${count}_people`;
  }

  return '_4_or_more_people';
};
