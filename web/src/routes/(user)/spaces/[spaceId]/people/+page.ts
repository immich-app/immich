import { authenticate } from '$lib/utils/auth';
import { getMembers, getSpace, getSpacePeople, getSpacePeopleStatistics } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url, params }) => {
  await authenticate(url);
  const [space, members, people, peopleStatistics] = await Promise.all([
    getSpace({ id: params.spaceId }),
    getMembers({ id: params.spaceId }),
    getSpacePeople({ id: params.spaceId, limit: 100 }),
    getSpacePeopleStatistics({ id: params.spaceId }),
  ]);

  return {
    space,
    members,
    people,
    peopleStatistics,
    meta: {
      title: `${space.name} - People`,
    },
  };
}) satisfies PageLoad;
