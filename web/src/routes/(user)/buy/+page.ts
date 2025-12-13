import { purchaseStore } from '$lib/stores/purchase.store';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { activateProduct, getActivationKey } from '$lib/utils/license-utils';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  const $t = await getFormatter();
  const licenseKey = url.searchParams.get('licenseKey');
  let activationKey = url.searchParams.get('activationKey');
  let isActivated: boolean | undefined = undefined;

  try {
    if (licenseKey && !activationKey) {
      activationKey = await getActivationKey(licenseKey);
    }

    if (licenseKey && activationKey) {
      const response = await activateProduct(licenseKey, activationKey);
      if (response.activatedAt !== '') {
        isActivated = true;
        purchaseStore.setPurchaseStatus(true);
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
