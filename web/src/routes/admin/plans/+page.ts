import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getStorage } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  const storage = await getStorage();
  const $t = await getFormatter();

  return {
    storage,
    meta: {
      title: $t('admin.plans'),
    },
  };
}) satisfies PageLoad;
