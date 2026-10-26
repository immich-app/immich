import { authenticate } from '#lib/utils/auth.js';
import { getAssetInfoFromParam, isSharedLinkRoute } from '#lib/utils/navigation.js';
import type { LayoutLoad } from './$types';

export const load = (async ({ url, params, route }) => {
  await authenticate(url, { public: isSharedLinkRoute(route.id) });
  const asset = await getAssetInfoFromParam(params);

  return {
    asset,
  };
}) satisfies LayoutLoad;
