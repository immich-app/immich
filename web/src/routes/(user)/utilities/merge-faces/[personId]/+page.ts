import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAllPeople, getPerson, getPersonStatistics } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  await authenticate();

  const [person, statistics, { people: similarPeople }] = await Promise.all([
    getPerson({ id: params.personId }),
    getPersonStatistics({ id: params.personId }),
    getAllPeople({ withHidden: false, closestPersonId: params.personId }),
  ]);
  const $t = await getFormatter();

  // Filter out the person we searched for since we don't want to merge with themselves
  const selfIndex = similarPeople.findIndex((person) => person.id === params.personId);
  if (selfIndex !== -1) {
    similarPeople.splice(selfIndex, 1);
  }

  return {
    person,
    statistics,
    similarPeople,
    meta: {
      title: person.name || $t('person'),
    },
  };
}) satisfies PageLoad;
