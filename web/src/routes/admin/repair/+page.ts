import { authenticate } from '$lib/utils/auth';
import { api } from '@api';
import type { PageLoad } from './$types';

export const load = (async () => {
  const user = await authenticate({ admin: true });
  const {
    data: { orphans, extras },
  } = await api.auditApi.getAuditFiles();

  return {
    user,
    orphans,
    extras,
    meta: {
      title: 'Repair',
    },
  };
}) satisfies PageLoad;
