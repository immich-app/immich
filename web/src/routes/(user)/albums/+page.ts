import { authenticate } from '$lib/utils/auth';
import { getAllAlbums } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  const albums = await getAllAlbums({});

  return {
    albums,
    meta: {
      title: 'Albums',
    },
  };
}) satisfies PageLoad;
