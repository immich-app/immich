import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAllJobsStatus } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });

  const jobs = await getAllJobsStatus();
  const $t = await getFormatter();

  return {
    jobs,
    meta: {
      title: $t('admin.job_status'),
    },
  };
}) satisfies PageLoad;
