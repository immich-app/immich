import { authenticate } from '$lib/utils/auth';
import { getAlbumInfo } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);
  const album = await getAlbumInfo({ id: params.albumId, withoutAssets: true });

  return {
    album,
    meta: {
      title: album.albumName,
    },
  };
}) satisfies PageLoad;
