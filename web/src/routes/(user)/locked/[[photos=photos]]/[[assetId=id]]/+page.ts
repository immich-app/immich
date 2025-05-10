import { AppRoute } from '$lib/constants';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getAuthStatus } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  await authenticate();
  const { hasElevatedPermission, pinCode } = await getAuthStatus();
  if (!hasElevatedPermission || !pinCode) {
    redirect(302, AppRoute.AUTH_PIN_PROMPT);
  }
  const asset = await getAssetInfoFromParam(params);
  const $t = await getFormatter();

  return {
    asset,
    meta: {
      title: $t('locked_folder'),
    },
  };
}) satisfies PageLoad;
