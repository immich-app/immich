import { authenticate, requestServerInfo } from '$lib/utils/auth';
import { api } from '@api';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });
  await requestServerInfo();
  const { data: allUsers } = await api.userApi.getAllUsers({ isAll: false });

  return {
    allUsers,
    meta: {
      title: 'User Management',
    },
  };
}) satisfies PageLoad;
