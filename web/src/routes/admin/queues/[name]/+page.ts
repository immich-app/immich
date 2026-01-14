import { AppRoute } from '$lib/constants';
import { fromQueueSlug } from '$lib/services/queue.service';
import { authenticate, requestServerInfo } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getQueue, getQueueJobs, QueueJobStatus } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url, { admin: true });
  await requestServerInfo();

  const name = fromQueueSlug(params.name);
  if (!name) {
    redirect(307, AppRoute.ADMIN_QUEUES);
  }

  const [queue, failedJobs] = await Promise.all([
    getQueue({ name }),
    getQueueJobs({ name, status: [QueueJobStatus.Failed, QueueJobStatus.Paused] }),
  ]);
  const $t = await getFormatter();

  return {
    queue,
    failedJobs,
    meta: {
      title: $t('admin.queue_details'),
    },
  };
}) satisfies PageLoad;
