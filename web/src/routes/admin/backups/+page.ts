import { getConfig, updateConfig } from '@immich/sdk';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  const $t = await getFormatter();

  const config = await getConfig().catch(() => undefined);
  if (config && !config.backup.beta) {
    const newConfig = await updateConfig({
      adminConfigDto: { ...config, backup: { ...config.backup, beta: true } },
    }).catch(() => undefined);

    if (newConfig) {
      eventManager.emit('SystemConfigUpdate', newConfig);
    }
  }

  return {
    meta: {
      title: $t('admin.backups'),
    },
  };
}) satisfies PageLoad;
