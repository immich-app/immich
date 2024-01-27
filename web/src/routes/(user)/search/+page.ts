import { authenticate } from '$lib/utils/auth';
import { type SearchResponseDto, api } from '@api';
import type { PageLoad } from './$types';
import { QueryParameter } from '$lib/constants';

export const load = (async (data) => {
  await authenticate();
  const url = new URL(data.url.href);
  const term =
    url.searchParams.get(QueryParameter.SEARCH_TERM) || url.searchParams.get(QueryParameter.QUERY) || undefined;
  let results: SearchResponseDto | null = null;
  if (term) {
    const { data } = await api.searchApi.search({}, { params: url.searchParams });
    results = data;
  }

  return {
    term,
    results,
    meta: {
      title: 'Search',
    },
  };
}) satisfies PageLoad;
