import { memoryManager } from '#lib/managers/memory-manager.svelte.ts';
import { queryClient } from '#lib/queries/client.ts';
import { getExploreDataQuery } from '#lib/queries/search.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { MemorySearchOrder, getAllPeople } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  memoryManager.setFilters({ size: 12, order: MemorySearchOrder.Desc });
  await memoryManager.applyPreferences();

  const [people] = await Promise.all([
    getAllPeople({ withHidden: false }),
    queryClient.query({ ...getExploreDataQuery(), staleTime: 0 }),
    memoryManager.refresh(),
  ]);
  const $t = await getFormatter();

  return {
    people,
    memories: memoryManager.memories,
    meta: {
      title: $t('explore'),
    },
  };
}) satisfies PageLoad;
