import { authenticate } from '$lib/utils/auth';
import { getApiKeys, getSessions } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();

  const keys = await getApiKeys();
  const sessions = await getSessions();

  return {
    keys,
    sessions,
    meta: {
      title: 'Settings',
    },
  };
}) satisfies PageLoad;
