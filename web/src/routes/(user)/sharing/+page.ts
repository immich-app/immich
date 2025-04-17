import { albumListingStore } from '$lib/stores/album-listing.store.svelte';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { PartnerDirection, getPartners } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  const sharedAlbums = albumListingStore.sharedAlbums;
  const partners = await getPartners({ direction: PartnerDirection.SharedWith });
  const $t = await getFormatter();

  return {
    sharedAlbums,
    partners,
    meta: {
      title: $t('sharing'),
    },
  };
}) satisfies PageLoad;
