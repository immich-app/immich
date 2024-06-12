import { authenticate } from '$lib/utils/auth';
import { getConfig } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });
  const configs = await getConfig();
  const $t = get(t);

  return {
    configs,
    meta: {
      title: $t('admin.system_settings'),
    },
  };
}) satisfies PageLoad;
