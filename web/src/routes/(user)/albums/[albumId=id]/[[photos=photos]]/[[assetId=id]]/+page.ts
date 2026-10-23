import { getAlbumInfoQuery } from '$lib/queries/album.query';
import { queryClient } from '$lib/queries/client';
import { authenticate } from '$lib/utils/auth';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);

  const album = await queryClient.query(getAlbumInfoQuery(params.albumId));

  return {
    meta: {
      title: album.albumName,
    },
  };
}) satisfies PageLoad;
