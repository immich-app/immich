import { loadConfig } from '$lib/stores/server-config.store';
import { authenticate } from '$lib/utils/auth';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });
  await loadConfig();
  return {
    meta: {
      title: 'Onboarding',
    },
  };
}) satisfies PageLoad;
