import { getAllPeople } from '@immich/sdk';
import { authenticate } from '$lib/utils/auth';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  const people = await getAllPeople({ withHidden: true });

  return {
    people,
  };
}) satisfies PageLoad;
