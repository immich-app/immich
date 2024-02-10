import { api } from '@api';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const { key, assetId } = params;
  const { data: asset } = await api.assetApi.getAssetInfo({ id: assetId, key });

  return {
    asset,
    key,
    meta: {
      title: 'Public Share',
    },
  };
}) satisfies PageLoad;
