import { authenticate } from '$lib/utils/auth';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  return {
    meta: {
      title: 'Backups',
    },
  };
}) satisfies PageLoad;
