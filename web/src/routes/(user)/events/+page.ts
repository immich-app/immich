import { authenticate } from '$lib/utils/auth';
import { getAllEvents } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ parent }) => {
  await authenticate({ parent });
  
  const events = await getAllEvents();

  return {
    events,
    meta: {
      title: 'Events',
    },
  };
}) satisfies PageLoad;
