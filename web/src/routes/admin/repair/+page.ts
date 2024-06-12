import { authenticate } from '$lib/utils/auth';
import { getAuditFiles } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });
  const { orphans, extras } = await getAuditFiles();
  const $t = get(t);

  return {
    orphans,
    extras,
    meta: {
      title: $t('repair'),
    },
  };
}) satisfies PageLoad;
