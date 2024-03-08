import { authenticate } from '$lib/utils/auth';
import { getUserById } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  await authenticate();

  const partner = await getUserById({ id: params.userId });

  return {
    partner,
    meta: {
      title: 'Partner',
    },
  };
}) satisfies PageLoad;
