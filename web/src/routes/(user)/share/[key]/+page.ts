import { getAssetThumbnailUrl } from '$lib/utils';
import { authenticate } from '$lib/utils/auth';
import { ThumbnailFormat, getMySharedLink } from '@immich/sdk';
import { error as throwError, type HttpError } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const { key } = params;
  await authenticate({ public: true });

  try {
    const sharedLink = await getMySharedLink({ key });
    const assetCount = sharedLink.assets.length;
    const assetId = sharedLink.album?.albumThumbnailAssetId || sharedLink.assets[0]?.id;

    return {
      sharedLink,
      meta: {
        title: sharedLink.album ? sharedLink.album.albumName : 'Public Share',
        description: sharedLink.description || `${assetCount} shared photos & videos.`,
        imageUrl: assetId ? getAssetThumbnailUrl(assetId, ThumbnailFormat.Webp) : '/feature-panel.png',
      },
    };
  } catch (error) {
    // handle unauthorized error
    // TODO this doesn't allow for 404 shared links anymore
    if ((error as HttpError).status === 401) {
      return {
        passwordRequired: true,
        sharedLinkKey: key,
        meta: {
          title: 'Password Required',
        },
      };
    }

    throwError(404, {
      message: 'Invalid shared link',
    });
  }
}) satisfies PageLoad;
