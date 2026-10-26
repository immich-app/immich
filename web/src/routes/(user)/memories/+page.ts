import { memoryManager } from '#lib/managers/memory-manager.svelte.js';
import { authenticate } from '#lib/utils/auth.js';
import { getFormatter } from '#lib/utils/i18n.js';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  const user = await authenticate(url);
  const $t = await getFormatter();

  await memoryManager.applyPreferences();

  return {
    user,
    meta: {
      title: $t('memories'),
    },
  };
}) satisfies PageLoad;
