import { authenticate, requestServerInfo } from '$lib/utils/auth';
import { getAllUsers } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });
  await requestServerInfo();
  const allUsers = await getAllUsers({ isAll: false });

  return {
    allUsers,
    meta: {
      title: 'User Management',
    },
  };
}) satisfies PageLoad;
