import { authenticate } from '$lib/utils/auth';
import { api } from '@api';
import type { PageLoad } from './$types';

export const load = (async () => {
  const user = await authenticate();
  const url = new URL(location.href);
  const term = url.searchParams.get('q') || url.searchParams.get('query') || undefined;

  const { data: results } = await api.searchApi.search({}, { params: url.searchParams });

  return {
    user,
    term,
    results,
    meta: {
      title: 'Search',
    },
  };
}) satisfies PageLoad;
