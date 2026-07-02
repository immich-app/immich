import { isEqual } from 'lodash-es';
import { QueryParameter } from '$lib/constants';
import { memoryManager } from '$lib/managers/memory-manager.svelte';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  const user = await authenticate(url);
  const $t = await getFormatter();

  const filters = url.searchParams.get('favorites') === 'true' ? { isSaved: true } : {};
  if (
    !(url.searchParams.has(QueryParameter.ID) && memoryManager.memories.length > 0) &&
    !isEqual(memoryManager.filters, filters)
  ) {
    memoryManager.filters = filters;
    await memoryManager.ready();
  }

  return {
    user,
    meta: {
      title: $t('memories'),
    },
  };
}) satisfies PageLoad;
