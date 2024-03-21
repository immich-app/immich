import { authenticate } from '$lib/utils/auth';
import { getAssetsByCity } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  const items = await getAssetsByCity();

  return {
    items,
    meta: {
      title: 'Places',
    },
  };
}) satisfies PageLoad;
