import { getAssetThumbnailUrl, setSharedLink } from '$lib/utils';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getConfig, getMySharedLink, isHttpError } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const { key } = params;
  await authenticate({ public: true });

  try {
    const getSharedLinkPromise = getMySharedLink({ key });
    const getAssetPromise = getAssetInfoFromParam(params);
    const getConfigPromise = getConfig();

    const [sharedLink, asset, config] = await Promise.all([getSharedLinkPromise, getAssetPromise, getConfigPromise]);

    setSharedLink(sharedLink);
    const assetCount = sharedLink.assets.length;
    const assetId = sharedLink.album?.albumThumbnailAssetId || sharedLink.assets[0]?.id;
    const assetPath = assetId ? getAssetThumbnailUrl(assetId) : '/feature-panel.png';
    const domain = config.server.externalDomain;

    const $t = await getFormatter();

    return {
      sharedLink,
      asset,
      key,
      meta: {
        title: sharedLink.album ? sharedLink.album.albumName : $t('public_share'),
        description: sharedLink.description || $t('shared_photos_and_videos_count', { values: { assetCount } }),
        imageUrl: `${domain}${assetPath}`,
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
