import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getApiKeys, getSessions } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();

  const keys = await getApiKeys();
  const sessions = await getSessions();
  const $t = await getFormatter();

  return {
    keys,
    sessions,
    meta: {
      title: $t('settings'),
    },
  };
}) satisfies PageLoad;
