import { queryClient } from '#lib/queries/client.ts';
import { getQueuesQuery } from '#lib/queries/queue.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });

  await queryClient.query(getQueuesQuery());
  const $t = await getFormatter();

  return {
    meta: {
      title: $t('admin.queues'),
    },
  };
}) satisfies PageLoad;
