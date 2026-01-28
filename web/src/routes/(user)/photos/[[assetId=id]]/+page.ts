import { memoryStore } from '$lib/stores/memory.store.svelte';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  const [$t] = await Promise.all([getFormatter(), memoryStore.ready()]);

  return {
    meta: {
      title: $t('photos'),
    },
  };
}) satisfies PageLoad;
