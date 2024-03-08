import { authenticate } from '$lib/utils/auth';
import { getAllAlbums, getPartners } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  const sharedAlbums = await getAllAlbums({ shared: true });
  const partners = await getPartners({ direction: 'shared-with' });

  return {
    sharedAlbums,
    partners,
    meta: {
      title: 'Sharing',
    },
  };
}) satisfies PageLoad;
