import { getAssetThumbnailUrl, setSharedLink } from '$lib/utils';
import { authenticate } from '$lib/utils/auth';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { ThumbnailFormat, getMySharedLink, isHttpError } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const { key } = params;
  console.log('authen ticate in key/photo/id page', key);
  await authenticate({ public: true });
  console.log('authenticated');
  const asset = await getAssetInfoFromParam(params, key);

  try {
    console.log('get shared link');
    const sharedLink = await getMySharedLink({ key });
    setSharedLink(sharedLink);
    const assetCount = sharedLink.assets.length;
    const assetId = sharedLink.album?.albumThumbnailAssetId || sharedLink.assets[0]?.id;

    return {
      sharedLink,
      asset,
      key,
      meta: {
        title: sharedLink.album ? sharedLink.album.albumName : 'Public Share',
        description: sharedLink.description || `${assetCount} shared photos & videos.`,
        imageUrl: assetId ? getAssetThumbnailUrl(assetId, ThumbnailFormat.Webp) : '/feature-panel.png',
      },
    };
  } catch (error) {
    if (isHttpError(error) && error.data.message === 'Invalid password') {
      return {
        passwordRequired: true,
        sharedLinkKey: key,
        meta: {
          title: 'Password Required',
        },
      };
    }

    throw error;
  }
}) satisfies PageLoad;
