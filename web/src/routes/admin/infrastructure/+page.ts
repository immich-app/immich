import { getConfig, getQueues, getStorage } from '@immich/sdk';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });

  const storage = await getStorage();
  const queues = await getQueues();
  const config = await getConfig();
  const $t = await getFormatter();

  return {
    storage,
    queues,
    config,
    meta: {
      title: $t('admin.infrastructure_settings'),
    },
  };
}) satisfies PageLoad;
