import { authenticate } from '$lib/utils/auth';
import { getAllPeople, getExploreData } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  const [items, response] = await Promise.all([getExploreData(), getAllPeople({ withHidden: false })]);
  const $t = get(t);

  return {
    items,
    response,
    meta: {
      title: $t('explore'),
    },
  };
}) satisfies PageLoad;
