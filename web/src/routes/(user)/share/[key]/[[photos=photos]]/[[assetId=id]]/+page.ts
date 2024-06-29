import { getAssetThumbnailUrl, setSharedLink } from '$lib/utils';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getMySharedLink, isHttpError } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const { key } = params;
  await authenticate({ public: true });
  const asset = await getAssetInfoFromParam(params);

  try {
    const sharedLink = await getMySharedLink({ key });
    setSharedLink(sharedLink);
    const assetCount = sharedLink.assets.length;
    const assetId = sharedLink.album?.albumThumbnailAssetId || sharedLink.assets[0]?.id;
    const $t = await getFormatter();

    return {
      sharedLink,
      asset,
      key,
      meta: {
        title: sharedLink.album ? sharedLink.album.albumName : $t('public_share'),
        description: sharedLink.description || $t('shared_photos_and_videos_count', { values: { assetCount } }),
        imageUrl: assetId ? getAssetThumbnailUrl(assetId) : '/feature-panel.png',
      },
    };
  } catch (error) {
    if (isHttpError(error) && error.data.message === 'Invalid password') {
      const $t = await getFormatter();
      return {
        passwordRequired: true,
        sharedLinkKey: key,
        meta: {
          title: $t('password_required'),
        },
      };
    }

    throw error;
  }
}) satisfies PageLoad;
