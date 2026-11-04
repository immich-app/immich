import { authenticate } from '$lib/utils/auth';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });

  return {
    meta: {
      title: 'Backup attempts',
    },
  };
}) satisfies PageLoad;
