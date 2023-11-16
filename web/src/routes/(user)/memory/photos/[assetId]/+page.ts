import { goto } from '$app/navigation';
import { AppRoute } from '$lib/constants';
import { authenticate } from '$lib/utils/auth';
import type { PageLoad } from './$types';

export const load = (async () => {
  const user = await authenticate();

  goto(AppRoute.PHOTOS);

  return {
    user,
    meta: {
      title: 'Photos',
    },
  };
}) satisfies PageLoad;
