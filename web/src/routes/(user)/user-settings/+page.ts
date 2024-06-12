import { authenticate } from '$lib/utils/auth';
import { getApiKeys, getSessions } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();

  const keys = await getApiKeys();
  const sessions = await getSessions();
  const $t = get(t);

  return {
    keys,
    sessions,
    meta: {
      title: $t('settings'),
    },
  };
}) satisfies PageLoad;
