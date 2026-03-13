import { authenticate } from '$lib/utils/auth';
import { getMembers, getSpace, getSpacePeople, getSpacePerson, getSpacePersonAssets } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url, params }) => {
  await authenticate(url);

  const action = url.searchParams.get('action');

  const [space, members, person, assetIds] = await Promise.all([
    getSpace({ id: params.spaceId }),
    getMembers({ id: params.spaceId }),
    getSpacePerson({ id: params.spaceId, personId: params.personId }),
    getSpacePersonAssets({ id: params.spaceId, personId: params.personId }),
  ]);

  // Only fetch all people if merging
  let allPeople: Awaited<ReturnType<typeof getSpacePeople>> = [];
  if (action === 'merge') {
    allPeople = await getSpacePeople({ id: params.spaceId });
  }

  return {
    space,
    members,
    person,
    assetIds,
    allPeople,
    action,
    meta: {
      title: `${person.alias || person.name || space.name} - ${space.name}`,
    },
  };
}) satisfies PageLoad;
