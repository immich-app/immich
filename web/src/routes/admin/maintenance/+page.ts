import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { listBackups } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  const { backups } = await listBackups();
  const $t = await getFormatter();

  return {
    backups,
    meta: {
      title: $t('admin.maintenance_settings'),
    },
  };
}) satisfies PageLoad;
