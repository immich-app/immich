import { loadConfig } from '$lib/stores/server-config.store';
import { authenticate } from '$lib/utils/auth';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });
  await loadConfig();

  const $t = get(t);

  return {
    meta: {
      title: $t('onboarding'),
    },
  };
}) satisfies PageLoad;
