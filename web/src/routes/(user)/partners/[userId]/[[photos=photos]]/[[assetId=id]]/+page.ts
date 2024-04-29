import { authenticate } from '$lib/utils/auth';
import { getUserById } from '@immich/sdk';
import type { PageLoad } from './$types';
import { getAssetInfoFromParam } from '$lib/utils/navigation';

export const load = (async ({ params }) => {
  await authenticate();

  const partner = await getUserById({ id: params.userId });
  const asset = await getAssetInfoFromParam(params);
  return {
    asset,
    partner,
    meta: {
      title: 'Partner',
    },
  };
}) satisfies PageLoad;
