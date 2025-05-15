import { AppRoute } from '$lib/constants';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAuthStatus } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate();

  const { isElevated, pinCode } = await getAuthStatus();

  const continuePath = url.searchParams.get('continue');

  if (isElevated) {
    redirect(302, continuePath ?? AppRoute.LOCKED);
  }

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('pin_verification'),
    },
    hasPinCode: !!pinCode,
    continuePath,
  };
}) satisfies PageLoad;
