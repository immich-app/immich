import { getUser } from '@immich/sdk';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
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
