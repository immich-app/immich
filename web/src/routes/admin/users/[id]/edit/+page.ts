import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('admin.user_details'),
    },
  };
}) satisfies PageLoad;
