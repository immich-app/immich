import { authenticate } from '$lib/utils/auth';
import { api } from '@api';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  await authenticate();

  const { data: partner } = await api.userApi.getUserById({ id: params.userId });

  return {
    partner,
    meta: {
      title: 'Partner',
    },
  };
}) satisfies PageLoad;
