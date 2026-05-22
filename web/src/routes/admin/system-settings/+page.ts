import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getConfig, getConfigDefaults } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  const config = await getConfig();
  const defaultConfig = await getConfigDefaults();
  const $t = await getFormatter();

  return {
    config,
    defaultConfig,
    meta: {
      title: $t('admin.system_settings'),
    },
  };
}) satisfies PageLoad;
