import { authenticate } from '$lib/utils/auth';
import { getAllAlbums, getPartners } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  const sharedAlbums = await getAllAlbums({ shared: true });
  const partners = await getPartners({ direction: 'shared-with' });
  const $t = get(t);

  return {
    sharedAlbums,
    partners,
    meta: {
      title: $t('sharing'),
    },
  };
}) satisfies PageLoad;
