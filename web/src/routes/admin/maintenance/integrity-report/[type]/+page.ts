import { authenticate } from '#lib/utils/auth.js';
import { getFormatter } from '#lib/utils/i18n.js';
import { getIntegrityReport, IntegrityReport } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  const type = params.type as IntegrityReport;

  await authenticate(url, { admin: true });
  const integrityReport = await getIntegrityReport({
    $type: type,
  });
  const $t = await getFormatter();

  return {
    type,
    integrityReport,
    meta: {
      title: $t(`admin.maintenance_integrity_${type}`),
    },
  };
}) satisfies PageLoad;
