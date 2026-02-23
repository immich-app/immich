import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getSessions } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  const sessions = await getSessions();
  const $t = await getFormatter();

  return {
    sessions,
    meta: {
      title: $t('settings'),
    },
  };
}) satisfies PageLoad;
