import { authenticate } from '$lib/utils/auth';
import { getMembers, getSpace, getSpacePerson } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url, params }) => {
  await authenticate(url);

  const action = url.searchParams.get('action');

  const [space, members, person] = await Promise.all([
    getSpace({ id: params.spaceId }),
    getMembers({ id: params.spaceId }),
    getSpacePerson({ id: params.spaceId, personId: params.personId }),
  ]);

  return {
    space,
    members,
    person,
    action,
    meta: {
      title: `${person.name || space.name} - ${space.name}`,
    },
  };
}) satisfies PageLoad;
