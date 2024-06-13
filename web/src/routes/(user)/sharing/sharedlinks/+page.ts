import { authenticate } from '$lib/utils/auth';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  const $t = get(t);

  return {
    meta: {
      title: $t('shared_links'),
    },
  };
}) satisfies PageLoad;
