import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getLargeAssets } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  // const asset = await getAssetInfoFromParam(params);
  const assets = await getLargeAssets();
  const $t = await getFormatter();

  return {
    assets: assets.assets,
    meta: {
      title: $t('large_assets'),
    },
  };
}) satisfies PageLoad;
