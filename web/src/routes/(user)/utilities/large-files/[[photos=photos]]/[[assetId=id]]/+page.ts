import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { searchLargeAssets } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);
  const [assets, asset] = await Promise.all([searchLargeAssets({ minFileSize: 0 }), getAssetInfoFromParam(params)]);
  const $t = await getFormatter();

  return {
    assets,
    asset,
    meta: {
      title: $t('large_files'),
    },
  };
}) satisfies PageLoad;
