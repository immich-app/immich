import { authenticate } from '$lib/utils/auth';
import { getConfig } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });
  const configs = await getConfig();

  return {
    configs,
    meta: {
      title: 'System Settings',
    },
  };
}) satisfies PageLoad;
