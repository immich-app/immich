import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAuditFiles } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });
  const { orphans, extras } = await getAuditFiles();
  const $t = await getFormatter();

  return {
    orphans,
    extras,
    meta: {
      title: $t('repair'),
    },
  };
}) satisfies PageLoad;
