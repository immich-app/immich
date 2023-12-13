import { authenticate } from '$lib/utils/auth';
import { api } from '@api';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });
  const { data: configs } = await api.systemConfigApi.getConfig();

  return {
    configs,
    meta: {
      title: 'System Settings',
    },
  };
}) satisfies PageLoad;
