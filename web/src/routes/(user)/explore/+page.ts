import { authenticate } from '$lib/utils/auth';
import { getAllPeople, getExploreData } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  const [items, response] = await Promise.all([getExploreData(), getAllPeople({ withHidden: false })]);

  return {
    items,
    response,
    meta: {
      title: 'Explore',
    },
  };
}) satisfies PageLoad;
