import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { getUser } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);

  const partner = await getUser({ id: params.userId });
  const $t = await getFormatter();

  return {
    partner,
    meta: {
      title: $t('partner'),
    },
  };
}) satisfies PageLoad;
