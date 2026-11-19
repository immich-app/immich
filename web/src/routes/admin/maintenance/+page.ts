import { queryClient } from '#lib/queries/client.ts';
import { getDatabaseBackupsQuery } from '#lib/queries/database-backup.query.ts';
import { getIntegrityReportSummaryQuery } from '#lib/queries/integrity-admin.query.ts';
import { getServerVersionQuery } from '#lib/queries/server-info.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  await Promise.all([
    queryClient.query(getIntegrityReportSummaryQuery()),
    queryClient.query(getServerVersionQuery()),
    queryClient.query(getDatabaseBackupsQuery()),
  ]);

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('admin.maintenance_settings'),
    },
  };
}) satisfies PageLoad;
