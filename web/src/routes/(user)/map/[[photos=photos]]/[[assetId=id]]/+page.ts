import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';
export const load = (async ({ params, url }) => {
  await authenticate(url);
  const $t = await getFormatter();

  return {
    assetId: params.assetId,
    meta: {
      title: $t('map'),
    },
  };
}) satisfies PageLoad;
