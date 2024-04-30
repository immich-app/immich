import { QueryParameter } from '$lib/constants';
import { getAssetThumbnailUrl, setSharedLink } from '$lib/utils';
import { authenticate } from '$lib/utils/auth';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { AssetOrderPreference, ThumbnailFormat, getMySharedLink, isHttpError } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  const { key } = params;
  await authenticate({ public: true });
  const asset = await getAssetInfoFromParam(params);

  try {
    const sharedLink = await getMySharedLink({ key });
    setSharedLink(sharedLink);
    const assetCount = sharedLink.assets.length;
    const assetId = sharedLink.album?.albumThumbnailAssetId || sharedLink.assets[0]?.id;
    const queryParamOrder: string | null = url.searchParams.get(QueryParameter.ORDER);
    const order: AssetOrderPreference | undefined = queryParamOrder
      ? (queryParamOrder as AssetOrderPreference)
      : undefined;

    return {
      sharedLink,
      asset,
      key,
      order,
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
