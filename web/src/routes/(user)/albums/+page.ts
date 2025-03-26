import { albumListingStore } from '$lib/stores/album-listing.store';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  const { albums, sharedAlbums, isCached } = await albumListingStore.getAlbums();
  const $t = await getFormatter();

  // The album data might be old, refetch
  // non-awaited async
  if (isCached) albumListingStore.refetchAlbums();

  return {
    albums,
    sharedAlbums,
    meta: {
      title: $t('albums'),
    },
  };
}) satisfies PageLoad;
