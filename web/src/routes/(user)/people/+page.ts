import { authenticate } from '$lib/utils/auth';
import { getAllPeople } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();

  const people = await getAllPeople({ withHidden: true });
  const $t = get(t);

  return {
    people,
    meta: {
      title: $t('people'),
    },
  };
}) satisfies PageLoad;
