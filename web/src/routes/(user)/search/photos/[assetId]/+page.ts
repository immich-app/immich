import { goto } from '$app/navigation';
import { AppRoute } from '$lib/constants';
import { authenticate } from '$lib/utils/auth';
import type { PageLoad } from './$types';

export const load = (async () => {
  const user = await authenticate();

  goto(AppRoute.SEARCH);

  return {
    user,
    meta: {
      title: 'Search',
    },
  };
}) satisfies PageLoad;
