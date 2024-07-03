import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getConfig } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });
  const configs = await getConfig();
  const $t = await getFormatter();

  return {
    configs,
    meta: {
      title: $t('admin.system_settings'),
    },
  };
}) satisfies PageLoad;
