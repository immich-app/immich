import { authenticate } from '$lib/utils/auth';
import { api } from '@api';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  const { data: items } = await api.searchApi.getExploreData();

  return {
    items,
    meta: {
      title: 'Places',
    },
  };
}) satisfies PageLoad;
