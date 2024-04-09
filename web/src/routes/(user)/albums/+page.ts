import { authenticate } from '$lib/utils/auth';
import { getAllAlbums } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  const sharedAlbums = await getAllAlbums({ shared: true });
  const albums = await getAllAlbums({});

  return {
    albums,
    sharedAlbums,
    meta: {
      title: 'Albums',
    },
  };
}) satisfies PageLoad;
