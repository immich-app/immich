import { queryClient } from '#lib/queries/client.ts';
import { getIntegrityReportQuery } from '#lib/queries/integrity-admin.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import type { IntegrityReport } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  const type = params.type as IntegrityReport;

  await authenticate(url, { admin: true });
  await queryClient.infiniteQuery(getIntegrityReportQuery(type));
  const $t = await getFormatter();

  return {
    type,
    meta: {
      title: $t(`admin.maintenance_integrity_${type}`),
    },
  };
}) satisfies PageLoad;
