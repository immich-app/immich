import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getServerVersion, listDatabaseBackups } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  const { backups } = await listDatabaseBackups();
  const $t = await getFormatter();
  const { major, minor, patch } = await getServerVersion();

  return {
    backups,
    expectedVersion: `${major}.${minor}.${patch}`,
    meta: {
      title: $t('admin.maintenance_settings'),
    },
  };
}) satisfies PageLoad;
