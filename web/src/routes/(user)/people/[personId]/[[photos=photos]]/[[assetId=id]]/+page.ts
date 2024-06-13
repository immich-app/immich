import { authenticate } from '$lib/utils/auth';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getPerson, getPersonStatistics } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  await authenticate();

  const [person, statistics, asset] = await Promise.all([
    getPerson({ id: params.personId }),
    getPersonStatistics({ id: params.personId }),
    getAssetInfoFromParam(params),
  ]);
  const $t = get(t);

  return {
    person,
    statistics,
    asset,
    meta: {
      title: person.name || $t('person'),
    },
  };
}) satisfies PageLoad;
