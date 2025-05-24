import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  const user = await authenticate(url);
  const asset = await getAssetInfoFromParam(params);
  const $t = await getFormatter();

  return {
    user,
    asset,
    meta: {
      title: $t('memory'),
    },
  };
}) satisfies PageLoad;
