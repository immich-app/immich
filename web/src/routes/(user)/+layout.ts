import { authenticate } from '#lib/utils/auth.ts';
import { getAssetInfoFromParam, isSharedLinkRoute } from '#lib/utils/navigation.ts';
import type { LayoutLoad } from './$types';

export const load = (async ({ url, params, route }) => {
  await authenticate(url, { public: isSharedLinkRoute(route.id) });
  const asset = await getAssetInfoFromParam(params);

  return {
    asset,
  };
}) satisfies LayoutLoad;
