import { AppRoute } from '$lib/constants';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAuthStatus } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();

  const { hasElevatedPermission, pinCode } = await getAuthStatus();

  if (hasElevatedPermission) {
    redirect(302, AppRoute.LOCKED);
  }

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('pin_verification'),
    },
    hasPinCode: !!pinCode,
  };
}) satisfies PageLoad;
