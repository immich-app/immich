import { authenticate } from '$lib/utils/auth';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const user = await authenticate();
  const asset = await getAssetInfoFromParam(params);

  return {
    user,
    asset,
    meta: {
      title: 'Memory',
    },
  };
}) satisfies PageLoad;
