import { authenticate } from '$lib/utils/auth';
import { getAllJobsStatus } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });

  const jobs = await getAllJobsStatus();
  const $t = get(t);

  return {
    jobs,
    meta: {
      title: $t('admin.job_status'),
    },
  };
}) satisfies PageLoad;
