import { QueryParameter } from '$lib/constants';
import { authenticate } from '$lib/utils/auth';
import { getMembers, getSpace, getSpacePerson, getSpacePersonStatistics } from '@immich/sdk';
import type { PageLoad } from './$types';

const getSafePreviousRoute = (url: URL) => {
  const previousRoute = url.searchParams.get(QueryParameter.PREVIOUS_ROUTE);
  if (!previousRoute) {
    return null;
  }

  return new URL(previousRoute, url).origin === url.origin ? previousRoute : null;
};

export const load = (async ({ url, params }) => {
  await authenticate(url);

  const action = url.searchParams.get(QueryParameter.ACTION);
  const previousRoute = getSafePreviousRoute(url);

  const [space, members, person, statistics] = await Promise.all([
    getSpace({ id: params.spaceId }),
    getMembers({ id: params.spaceId }),
    getSpacePerson({ id: params.spaceId, personId: params.personId }),
    getSpacePersonStatistics({ id: params.spaceId, personId: params.personId }),
  ]);

  return {
    space,
    members,
    person,
    statistics,
    action,
    previousRoute,
    meta: {
      title: `${person.name || space.name} - ${space.name}`,
    },
  };
}) satisfies PageLoad;
