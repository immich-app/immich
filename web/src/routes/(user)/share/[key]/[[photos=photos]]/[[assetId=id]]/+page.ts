import { getAssetThumbnailUrl, setSharedLink } from '$lib/utils';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getMySharedLink, isHttpError } from '@immich/sdk';
import type { PageLoad } from './$types';

export const ssr = true;

export const load = (async ({ params }) => {
  const { key } = params;
  await authenticate({ public: true });

  const $t = await getFormatter();

  try {
    const [sharedLink, asset] = await Promise.all([getMySharedLink({ key }), getAssetInfoFromParam(params)]);
    setSharedLink(sharedLink);
    const assetCount = sharedLink.assets.length;
    const assetId = sharedLink.album?.albumThumbnailAssetId || sharedLink.assets[0]?.id;
    const assetPath = assetId ? getAssetThumbnailUrl(assetId) : '/feature-panel.png';

    return {
      sharedLink,
      sharedLinkKey: key,
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
