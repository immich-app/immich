import { authenticate } from '$lib/utils/auth';
import type { PageLoad } from './$types';

export const load = (async () => {
  const user = await authenticate();
  return {
    user,
    meta: {
      title: 'Favorites',
    },
  };
}) satisfies PageLoad;
