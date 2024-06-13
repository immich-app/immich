import { authenticate } from '$lib/utils/auth';
import { getAssetsByCity } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  const items = await getAssetsByCity();
  const $t = get(t);

  return {
    items,
    meta: {
      title: $t('places'),
    },
  };
}) satisfies PageLoad;
