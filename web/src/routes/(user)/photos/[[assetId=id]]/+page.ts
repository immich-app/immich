import { DateTime } from 'luxon';
import { memoryManager } from '$lib/managers/memory-manager.svelte';
import { authenticate } from '$lib/utils/auth';
import { asLocalTimeISO } from '$lib/utils/date-time';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  const $t = await getFormatter();

  if (memoryManager.filters === undefined || memoryManager.filters.$for !== asLocalTimeISO(DateTime.now())) {
    memoryManager.filters = { $for: asLocalTimeISO(DateTime.now()) };
  }

  return {
    meta: {
      title: $t('photos'),
    },
  };
}) satisfies PageLoad;
