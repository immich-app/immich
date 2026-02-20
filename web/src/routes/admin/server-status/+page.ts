import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getServerStatistics } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  const statsPromise = getServerStatistics();
  const $t = await getFormatter();

  return {
    statsPromise,
    meta: {
      title: $t('server_stats'),
    },
  };
}) satisfies PageLoad;
