import { getAllPeople, getExploreData, MemorySearchOrder } from '@immich/sdk';
import { memoryManager } from '$lib/managers/memory-manager.svelte';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  memoryManager.filters = { size: 12, order: MemorySearchOrder.Desc };

  const [explore, people] = await Promise.all([
    getExploreData(),
    getAllPeople({ withHidden: false }),
    memoryManager.ready(),
  ]);
  const $t = await getFormatter();

  return {
    explore,
    people,
    memories: memoryManager.memories,
    meta: {
      title: $t('explore'),
    },
  };
}) satisfies PageLoad;
