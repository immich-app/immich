import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getPerson, getPersonStatistics } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);

  const [person, statistics] = await Promise.all([
    getPerson({ id: params.personId }),
    getPersonStatistics({ id: params.personId }),
  ]);
  const $t = await getFormatter();

  return {
    person,
    statistics,
    meta: {
      title: person.name || $t('person'),
    },
  };
}) satisfies PageLoad;
