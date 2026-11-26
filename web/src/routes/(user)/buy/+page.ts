import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { activateProduct, getActivationKey } from '#lib/utils/license-utils.ts';
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
      const license = await activateProduct(licenseKey, activationKey, { meta: { error: { toast: false } } });
      isActivated = !!license?.activatedAt;
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
