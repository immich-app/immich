import featurePanelUrl from '$lib/assets/feature-panel.png';
import { api as clientApi, ThumbnailFormat } from '@api';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals: { api } }) => {
  const { key } = params;

  try {
    const { data: sharedLink } = await api.sharedLinkApi.getMySharedLink({ key });

    const assetCount = sharedLink.assets.length;
    const assetId = sharedLink.album?.albumThumbnailAssetId || sharedLink.assets[0]?.id;

    return {
      sharedLink,
      meta: {
        title: sharedLink.album ? sharedLink.album.albumName : 'Public Share',
        description: sharedLink.description || `${assetCount} shared photos & videos.`,
        imageUrl: assetId
          ? clientApi.getAssetThumbnailUrl(assetId, ThumbnailFormat.Webp, sharedLink.key)
          : featurePanelUrl,
      },
    };
  } catch (e) {
    throw error(404, {
      message: 'Invalid shared link',
    });
  }
}) satisfies PageServerLoad;
