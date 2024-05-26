import { authenticate, requestServerInfo } from '$lib/utils/auth';
import { searchUsersAdmin } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });
  await requestServerInfo();
  const allUsers = await searchUsersAdmin({ withDeleted: true });

  return {
    allUsers,
    meta: {
      title: 'User Management',
    },
  };
}) satisfies PageLoad;
