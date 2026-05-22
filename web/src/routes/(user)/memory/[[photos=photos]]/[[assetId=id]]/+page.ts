import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  const user = await authenticate(url);
  const $t = await getFormatter();

  return {
    user,
    meta: {
      title: $t('memory'),
    },
  };
}) satisfies PageLoad;
