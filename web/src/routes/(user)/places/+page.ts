import { authenticate } from '$lib/utils/auth';
import { api } from '@api';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  const { data: items } = await api.searchApi.getExploreData({ params: { size: -1 }});
  return {
    items,
    meta: {
      title: 'Places',
    },
  };
}) satisfies PageLoad;
