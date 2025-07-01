import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAllPeople, getExploreData } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  const [items, response] = await Promise.all([getExploreData(), getAllPeople({ withHidden: false })]);
  const $t = await getFormatter();

  return {
    items,
    response,
    meta: {
      title: $t('explore'),
    },
  };
}) satisfies PageLoad;
