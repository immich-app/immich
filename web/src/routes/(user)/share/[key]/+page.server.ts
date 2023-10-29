import featurePanelUrl from '$lib/assets/feature-panel.png';
import { api as clientApi, ThumbnailFormat } from '@api';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { AxiosError } from 'axios';

export const load = (async ({ params, locals: { api }, cookies }) => {
  const { key } = params;
  const token = cookies.get('immich_shared_link_token');

  try {
    const { data: sharedLink } = await api.sharedLinkApi.getMySharedLink({ key, token });

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
    // handle unauthorized error
    if ((e as AxiosError).response?.status === 401) {
      return {
        passwordRequired: true,
        sharedLinkKey: key,
        meta: {
          title: 'Password Required',
        },
      };
    }

    throw error(404, {
      message: 'Invalid shared link',
    });
  }
}) satisfies PageServerLoad;
