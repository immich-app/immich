import { memoryManager } from '#lib/managers/memory-manager.svelte.ts';
import { queryClient } from '#lib/queries/client.ts';
import { getAllPeopleQuery } from '#lib/queries/person.query.ts';
import { getExploreDataQuery } from '#lib/queries/search.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  memoryManager.applyPreferences();

  const [memories] = await Promise.all([
    memoryManager.loadMemories(),
    queryClient.query({ ...getAllPeopleQuery({ withHidden: false }), staleTime: 0 }),
    queryClient.query({ ...getExploreDataQuery(), staleTime: 0 }),
  ]);
  const $t = await getFormatter();

  return {
    memories,
    meta: {
      title: $t('explore'),
    },
  };
}) satisfies PageLoad;
