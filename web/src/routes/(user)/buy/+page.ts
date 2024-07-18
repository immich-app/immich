import { licenseStore } from '$lib/stores/license.store';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { activateLicense, getActivationKey } from '$lib/utils/license-utils';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate();

  const $t = await getFormatter();
  const licenseKey = url.searchParams.get('licenseKey');
  let activationKey = url.searchParams.get('activationKey');
  let isActivated: boolean | undefined = undefined;

  try {
    if (licenseKey && !activationKey) {
      activationKey = await getActivationKey(licenseKey);
    }

    if (licenseKey && activationKey) {
      const response = await activateLicense(licenseKey, activationKey);
      if (response.activatedAt !== '') {
        isActivated = true;
        licenseStore.setLicenseStatus(true);
      }
    }
  } catch (error) {
    isActivated = false;
    console.log('error navigating to /buy', error);
  }

  return {
    meta: {
      title: $t('buy'),
    },
    isActivated,
  };
}) satisfies PageLoad;
