import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getIntegrityReport, IntegrityReportType } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  const type = params.type as IntegrityReportType;

  await authenticate(url, { admin: true });
  const integrityReport = await getIntegrityReport({
    integrityGetReportDto: {
      type,
    },
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
