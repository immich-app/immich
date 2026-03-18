import { authenticate } from '$lib/utils/auth';
import { getSessions } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  const sessions = await getSessions();

  return {
    sessions,
  };
}) satisfies PageLoad;
