import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { activateLicense, getActivationKey } from '$lib/utils/license-utils';
import type { LicenseResponseDto } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate();

  const $t = await getFormatter();
  const licenseKey = url.searchParams.get('licenseKey');
  let activationKey = url.searchParams.get('activationKey');
  let activationResult: LicenseResponseDto | undefined;

  if (licenseKey && !activationKey) {
    activationKey = await getActivationKey(licenseKey);
  }

  if (licenseKey && activationKey) {
    activationResult = await activateLicense(licenseKey, activationKey);
  }

  return {
    meta: {
      title: $t('buy'),
    },
    activationResult,
  };
}) satisfies PageLoad;
