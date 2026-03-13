import { authenticate } from '$lib/utils/auth';
import { getMembers, getSpace } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url, params }) => {
  await authenticate(url);
  const [space, members] = await Promise.all([getSpace({ id: params.spaceId }), getMembers({ id: params.spaceId })]);

  return {
    space,
    members,
    meta: {
      title: space.name,
    },
  };
}) satisfies PageLoad;
