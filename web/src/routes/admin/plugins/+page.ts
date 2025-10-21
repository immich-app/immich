import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  const plugins = [];
  const $t = await getFormatter();

  return {
    plugins,
    meta: {
      title: $t('plugins'),
    },
  };
}) satisfies PageLoad;
