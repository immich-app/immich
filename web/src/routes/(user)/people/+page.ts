import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAllPeople, getPeopleStatistics } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  const [people, peopleStatistics] = await Promise.all([
    getAllPeople({ withHidden: true, withSharedSpaces: true }),
    getPeopleStatistics({ withSharedSpaces: true }).catch(() => null),
  ]);
  const $t = await getFormatter();

  return {
    people,
    peopleStatistics,
    meta: {
      title: $t('people'),
    },
  };
}) satisfies PageLoad;
