import { AppRoute } from '$lib/constants';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getAuthStatus } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate();
  const { isElevated, pinCode } = await getAuthStatus();
  let extractedPath: string | undefined;
  const regex = /\/locked\/(photos\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/;
  const match = url.pathname.match(regex);

  if (match && match[1]) {
    extractedPath = match[1];
  }

  if (!isElevated || !pinCode) {
    let redirectPath = `${AppRoute.AUTH_PIN_PROMPT}`;
    if (extractedPath) {
      redirectPath += `?continue=${extractedPath}`;
    }

    redirect(302, redirectPath);
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
