import { QueryParameter } from '$lib/constants';
import { searchQuery } from '$lib/stores/search.store';
import { authenticate } from '$lib/utils/auth';
import {
  searchMetadata,
  searchSmart,
  type MetadataSearchDto,
  type SearchResponseDto,
  type SmartSearchDto,
} from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async (data) => {
  await authenticate();
  const url = new URL(data.url.href);
  const term =
    url.searchParams.get(QueryParameter.SEARCH_TERM) || url.searchParams.get(QueryParameter.QUERY) || undefined;
  let results: SearchResponseDto | null = null;
  if (term) {
    const payload = JSON.parse(term) as SmartSearchDto | MetadataSearchDto;
    searchQuery.set(payload);

    results =
      payload && 'query' in payload
        ? await searchSmart({ smartSearchDto: { ...payload, withExif: true } })
        : await searchMetadata({ metadataSearchDto: { ...payload, withExif: true } });
  }

  return {
    term,
    results,
    meta: {
      title: 'Search',
    },
  };
}) satisfies PageLoad;
