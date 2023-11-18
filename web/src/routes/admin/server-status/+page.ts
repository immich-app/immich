import { authenticate } from '$lib/utils/auth';
import { api } from '@api';
import type { PageLoad } from './$types';

export const load = (async () => {
  const user = await authenticate({ admin: true });
  const { data: stats } = await api.serverInfoApi.getServerStatistics();

  return {
    user,
    stats,
    meta: {
      title: 'Server Stats',
    },
  };
}) satisfies PageLoad;
