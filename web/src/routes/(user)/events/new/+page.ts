import { authenticate } from '$lib/utils/auth';
import type { PageLoad } from './$types';

export const load = (async ({ parent }) => {
  await authenticate({ parent });

  return {
    meta: {
      title: 'Create Event',
    },
  };
}) satisfies PageLoad;
