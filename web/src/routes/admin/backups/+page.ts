import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { getConfig, updateConfig } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  const $t = await getFormatter();

  try {
    const config = await getConfig();
    if (!config.backup.beta) {
      const newConfig = await updateConfig({
        adminConfigDto: { ...config, backup: { ...config.backup, beta: true } },
      });

      eventManager.emit('SystemConfigUpdate', newConfig);
    }
  } catch {
    // no-op
  }

  return {
    meta: {
      title: $t('admin.backups'),
    },
  };
}) satisfies PageLoad;
