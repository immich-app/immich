import { authenticate } from '$lib/utils/auth';
import { getPerson, getPersonStatistics } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  await authenticate();

  const [person, statistics] = await Promise.all([
    getPerson({ id: params.personId }),
    getPersonStatistics({ id: params.personId }),
  ]);

  return {
    person,
    statistics,
    meta: {
      title: person.name || 'Person',
    },
  };
}) satisfies PageLoad;
