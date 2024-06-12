import { authenticate } from '$lib/utils/auth';
import { getServerStatistics } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });
  const stats = await getServerStatistics();
  const $t = get(t);

  return {
    stats,
    meta: {
      title: $t('server_stats'),
    },
  };
}) satisfies PageLoad;
