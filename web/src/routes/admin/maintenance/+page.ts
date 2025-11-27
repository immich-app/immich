import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getIntegrityReport } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  const integrityReport = await getIntegrityReport();
  const $t = await getFormatter();

  return {
    integrityReport,
    meta: {
      title: $t('admin.system_settings'),
    },
  };
}) satisfies PageLoad;
