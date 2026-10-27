import { authenticate } from '#lib/utils/auth.ts';
import { getAllPeople } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  const people = await getAllPeople({ withHidden: true });

  return {
    people,
  };
}) satisfies PageLoad;
