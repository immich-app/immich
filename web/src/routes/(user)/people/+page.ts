import { authenticate } from '$lib/utils/auth';
import { getAllPeople } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();

  const people = await getAllPeople({ withHidden: true });
  return {
    people,
    meta: {
      title: 'People',
    },
  };
}) satisfies PageLoad;
