import { authenticate } from '$lib/utils/auth';
import { api } from '@api';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  const { data: items } = await api.searchApi.getExploreData();
  const { data: response } = await api.personApi.getAllPeople({ withHidden: false });
  return {
    items,
    response,
    meta: {
      title: 'Explore',
    },
  };
}) satisfies PageLoad;
