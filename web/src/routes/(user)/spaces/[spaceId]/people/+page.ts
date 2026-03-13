import { authenticate } from '$lib/utils/auth';
import { getMembers, getSpace, getSpacePeople } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url, params }) => {
  await authenticate(url);
  const [space, members, people] = await Promise.all([
    getSpace({ id: params.spaceId }),
    getMembers({ id: params.spaceId }),
    getSpacePeople({ id: params.spaceId }),
  ]);

  return {
    space,
    members,
    people,
    meta: {
      title: `${space.name} - People`,
    },
  };
}) satisfies PageLoad;
