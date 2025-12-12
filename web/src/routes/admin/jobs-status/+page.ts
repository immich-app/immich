import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getQueuesLegacy } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });

  const jobs = await getQueuesLegacy();
  const $t = await getFormatter();

  return {
    jobs,
    meta: {
      title: $t('admin.job_status'),
    },
  };
}) satisfies PageLoad;
