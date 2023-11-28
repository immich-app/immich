import { authenticate } from '$lib/utils/auth';
import { api } from '@api';
import type { PageLoad } from './$types';

export const load = (async () => {
  const user = await authenticate({ admin: true });
  const { data: allUsers } = await api.userApi.getAllUsers({ isAll: false });

  return {
    user,
    allUsers,
    meta: {
      title: 'User Management',
    },
  };
}) satisfies PageLoad;
