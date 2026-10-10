import { getAllPeople, getExploreData, searchMemories } from '@immich/sdk';
import { memoryManager } from '$lib/managers/memory-manager.svelte';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  const peoplePromise = getAllPeople({ withHidden: false });
  const [explore, memories] = await Promise.all([
    getExploreData(),
    searchMemories({ ...memoryManager.preferenceFilters, page: 1 }),
  ]);
  const $t = await getFormatter();

  return {
    explore,
    peoplePromise,
    memories,
    meta: {
      title: $t('explore'),
    },
  };
}) satisfies PageLoad;
