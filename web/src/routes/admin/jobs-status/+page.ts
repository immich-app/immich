import { authenticate } from '$lib/utils/auth';
import { api } from '@api';
import type { PageLoad } from './$types';

export const load = (async () => {
  const user = await authenticate({ admin: true });

  const { data: jobs } = await api.jobApi.getAllJobsStatus();

  return {
    user,
    jobs,
    meta: {
      title: 'Job Status',
    },
  };
}) satisfies PageLoad;
