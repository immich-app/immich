import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getServerStatistics } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });
  const stats = await getServerStatistics();
  const $t = await getFormatter();

  return {
    stats,
    meta: {
      title: $t('server_stats'),
    },
  };
}) satisfies PageLoad;
