import { loadConfig } from '$lib/stores/server-config.store';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });
  await loadConfig();

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('onboarding'),
    },
  };
}) satisfies PageLoad;
