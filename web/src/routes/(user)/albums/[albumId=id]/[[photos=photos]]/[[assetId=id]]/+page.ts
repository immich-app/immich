import { getAlbumInfoQuery } from '#lib/queries/album.query.ts';
import { queryClient } from '#lib/queries/client.ts';
import { authenticate } from '#lib/utils/auth.ts';
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
