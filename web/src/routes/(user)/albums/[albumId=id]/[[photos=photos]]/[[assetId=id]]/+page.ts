import { getAlbumInfo } from '@immich/sdk';
import { authenticate } from '$lib/utils/auth';
import type { PageLoad } from './$types';

export const load = (async ({ params, url, depends }) => {
  await authenticate(url);

  depends('album:data');

  const album = await getAlbumInfo({ id: params.albumId });

  return {
    album,
    meta: {
      title: album.albumName,
    },
  };
}) satisfies PageLoad;
