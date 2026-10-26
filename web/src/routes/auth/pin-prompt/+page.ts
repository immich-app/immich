import { Route } from '#lib/route.js';
import { authenticate } from '#lib/utils/auth.js';
import { getFormatter } from '#lib/utils/i18n.js';
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
    continueUrl: Route.continue(url.searchParams.get('continue'), Route.locked()),
  };
}) satisfies PageLoad;
