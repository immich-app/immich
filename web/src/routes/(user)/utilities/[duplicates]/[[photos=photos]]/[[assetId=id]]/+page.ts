import { authenticate } from '$lib/utils/auth';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getAssetDuplicates } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  await authenticate();
  const asset = await getAssetInfoFromParam(params);
  const duplicates = await getAssetDuplicates();

  return {
    asset,
    duplicates,
    meta: {
      title: 'Duplicates',
    },
  };
}) satisfies PageLoad;
