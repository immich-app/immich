import { queryClient } from '#lib/queries/client.ts';
import { getPersonQuery, getPersonStatisticsQuery } from '#lib/queries/person.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);

  const [person] = await Promise.all([
    queryClient.query({ ...getPersonQuery(params.personId), staleTime: 0 }),
    queryClient.query({ ...getPersonStatisticsQuery(params.personId), staleTime: 0 }),
  ]);
  const $t = await getFormatter();

  return {
    meta: {
      title: person.name || $t('person'),
    },
  };
}) satisfies PageLoad;
