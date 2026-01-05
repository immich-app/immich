import { AppRoute } from '$lib/constants';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAuthStatus } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  const { isElevated, pinCode } = await getAuthStatus();
  if (!isElevated || !pinCode) {
    redirect(307, `${AppRoute.AUTH_PIN_PROMPT}?continue=${encodeURIComponent(url.pathname + url.search)}`);
  }

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('locked_folder'),
    },
  };
}) satisfies PageLoad;
