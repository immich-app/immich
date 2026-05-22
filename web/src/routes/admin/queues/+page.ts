import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getQueues } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });

  const queues = await getQueues();
  const $t = await getFormatter();

  return {
    queues,
    meta: {
      title: $t('admin.queues'),
    },
  };
}) satisfies PageLoad;
