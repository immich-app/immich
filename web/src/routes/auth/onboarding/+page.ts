import type { PageLoad } from './$types';
import { authenticate } from '$lib/utils/auth';
import { loadConfig } from '$lib/stores/server-config.store';

export const load = (async () => {
  await authenticate({ admin: true });
  await loadConfig();
  return {
    meta: {
      title: 'Onboarding',
    },
  };
}) satisfies PageLoad;
