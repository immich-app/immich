import { authenticate } from '$lib/utils/auth';
import { search, type AssetResponseDto, type SearchResponseDto } from '@immich/sdk';
import type { PageLoad } from './$types';
import { QueryParameter } from '$lib/constants';

export const load = (async (data) => {
  await authenticate();
  const url = new URL(data.url.href);
  const term =
    url.searchParams.get(QueryParameter.SEARCH_TERM) || url.searchParams.get(QueryParameter.QUERY) || undefined;
  let results: SearchResponseDto | null = null;
  if (term) {
    const response = await search({ ...data.url.searchParams });
    let items: AssetResponseDto[] = (data as unknown as { results: SearchResponseDto }).results?.assets.items;
    if (items) {
      items.push(...response.assets.items);
    } else {
      items = response.assets.items;
    }
    const assets = { ...response.assets, items };
    results = {
      assets,
      albums: response.albums,
    };
  }

  return {
    term,
    results,
    meta: {
      title: 'Search',
    },
  };
}) satisfies PageLoad;
