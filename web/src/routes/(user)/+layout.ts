import { getAssetInfoFromParam } from '$lib/utils/navigation';
import type { LayoutLoad } from './$types';

export const load = (async ({ params }) => {
  const asset = await getAssetInfoFromParam(params);

  return {
    asset,
  };
}) satisfies LayoutLoad;
