import { AppRoute } from '$lib/constants';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAuthStatus } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  const { pinCode } = await getAuthStatus();

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('pin_verification'),
    },
    hasPinCode: !!pinCode,
    continueUrl: url.searchParams.get('continue') || AppRoute.LOCKED,
  };
}) satisfies PageLoad;
