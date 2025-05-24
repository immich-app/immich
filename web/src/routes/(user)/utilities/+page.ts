import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);
  const asset = await getAssetInfoFromParam(params);
  const $t = await getFormatter();

  return {
    asset,
    meta: {
      title: $t('utilities'),
    },
  };
}) satisfies PageLoad;
