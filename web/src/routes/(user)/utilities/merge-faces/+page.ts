import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAllPeople } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();

  const people = await getAllPeople({ withHidden: true });
  const $t = await getFormatter();

  return {
    people,
    meta: {
      title: $t('people'),
    },
  };
}) satisfies PageLoad;
