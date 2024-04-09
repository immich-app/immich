import { authenticate } from '$lib/utils/auth';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  await authenticate();
  const asset = await getAssetInfoFromParam(params);

  return {
    asset,
    meta: {
      title: 'Map',
    },
  };
}) satisfies PageLoad;
