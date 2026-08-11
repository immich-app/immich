import { licenseManager } from '$lib/managers/license-manager.svelte';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  const $t = await getFormatter();
  const licenseKey = url.searchParams.get('licenseKey');
  let isActivated: boolean | undefined;

  if (licenseKey) {
    try {
      const { activatedAt } = await licenseManager.activate(licenseKey, url.searchParams.get('activationKey'));
      isActivated = activatedAt !== '';
    } catch (error) {
      isActivated = false;
      console.error(`Failed to activate license key: ${error}`, error);
    }
  }

  return {
    meta: {
      title: $t('buy'),
    },
    isActivated,
  };
}) satisfies PageLoad;
