import { authenticate } from '$lib/utils/auth';
import { getExploreData } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  const items = await getExploreData();

  return {
    items,
    meta: {
      title: 'Places',
    },
  };
}) satisfies PageLoad;
