import { locale } from '$lib/stores/preferences.store';
import { getAssetThumbnailUrl, setSharedLink } from '$lib/utils';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getMySharedLink, isHttpError } from '@immich/sdk';
import { DateTime, type ToRelativeUnit } from 'luxon';
import { get } from 'svelte/store';

export const asQueryString = ({ slug, key }: { slug?: string; key?: string }) => {
  const params = new URLSearchParams();
  if (slug) {
    params.set('slug', slug);
  }

  if (key) {
    params.set('key', key);
  }

  return params.toString();
};

export const loadSharedLink = async ({
  url,
  params,
}: {
  url: URL;
  params: { key?: string; slug?: string; assetId?: string };
}) => {
  const { key, slug } = params;
  await authenticate(url, { public: true });

  const common = { key, slug };

  const $t = await getFormatter();

  try {
    const [sharedLink, asset] = await Promise.all([getMySharedLink({ key, slug }), getAssetInfoFromParam(params)]);
    setSharedLink(sharedLink);
    const assetCount = sharedLink.assets.length;
    const assetId = sharedLink.album?.albumThumbnailAssetId || sharedLink.assets[0]?.id;
    const assetPath = assetId ? getAssetThumbnailUrl(assetId) : '/feature-panel.png';

    return {
      ...common,
      sharedLink,
      asset,
      meta: {
        title: sharedLink.album ? sharedLink.album.albumName : $t('public_share'),
        description: sharedLink.description || $t('shared_photos_and_videos_count', { values: { assetCount } }),
        imageUrl: assetPath,
      },
    };
  } catch (error) {
    if (isHttpError(error) && error.data.message === 'Invalid password') {
      return {
        ...common,
        passwordRequired: true,
        meta: {
          title: $t('password_required'),
        },
      };
    }

    throw error;
  }
};

export const getCountDownExpirationDate = (expiresAtDate: DateTime, now: DateTime) => {
  const relativeUnits: ToRelativeUnit[] = ['days', 'hours', 'minutes', 'seconds'];
  const expirationCountdown = expiresAtDate.diff(now, relativeUnits).toObject();

  for (const unit of relativeUnits) {
    const value = expirationCountdown[unit];
    if (value && value > 0) {
      return expiresAtDate.toRelativeCalendar({ base: now, locale: get(locale), unit });
    }
  }
};
