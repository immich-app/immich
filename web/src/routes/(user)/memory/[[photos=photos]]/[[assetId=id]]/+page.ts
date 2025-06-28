import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  const user = await authenticate(url);
  const $t = await getFormatter();

  return {
    user,
    assetId: params.assetId,
    meta: {
      title: $t('memory'),
    },
  };
}) satisfies PageLoad;
