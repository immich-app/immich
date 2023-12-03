import { authenticate } from '$lib/utils/auth';
import { api } from '@api';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const user = await authenticate();

  const { data: person } = await api.personApi.getPerson({ id: params.personId });
  const { data: statistics } = await api.personApi.getPersonStatistics({ id: params.personId });

  return {
    user,
    person,
    statistics,
    meta: {
      title: person.name || 'Person',
    },
  };
}) satisfies PageLoad;
