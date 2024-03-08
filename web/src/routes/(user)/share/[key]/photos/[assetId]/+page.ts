import { getAssetInfo } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const { key, assetId } = params;
  const asset = await getAssetInfo({ id: assetId, key });

  return {
    asset,
    key,
    meta: {
      title: 'Public Share',
    },
  };
}) satisfies PageLoad;
