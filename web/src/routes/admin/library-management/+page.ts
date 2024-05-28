import { authenticate, requestServerInfo } from '$lib/utils/auth';
import { searchUsersAdmin } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });
  await requestServerInfo();
  const allUsers = await searchUsersAdmin({ withDeleted: false });

  return {
    allUsers,
    meta: {
      title: 'External Library Management',
    },
  };
}) satisfies PageLoad;
