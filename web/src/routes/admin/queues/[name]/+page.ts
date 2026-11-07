import { queryClient } from '#lib/queries/client.ts';
import { getQueueQuery } from '#lib/queries/queue.query.ts';
import { Route, fromQueueSlug } from '#lib/route.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url, { admin: true });

  const name = fromQueueSlug(params.name);
  if (!name) {
    redirect(307, Route.queues());
  }

  await queryClient.query(getQueueQuery(name)).catch(() => redirect(307, Route.queues()));
  const $t = await getFormatter();

  return {
    name,
    meta: {
      title: $t('admin.queue_details'),
    },
  };
}) satisfies PageLoad;
