import { albumListingStore } from '$lib/stores/album-listing.store.svelte';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  const { isCached } = await albumListingStore.getAlbums();
  const $t = await getFormatter();

  if (isCached) {
    // The album data might be old, refetch but don't wait as we have data already
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    albumListingStore.refetchAlbums();
  }

  return {
    meta: {
      title: $t('albums'),
    },
  };
}) satisfies PageLoad;
