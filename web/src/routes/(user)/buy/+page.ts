import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate();

  const $t = await getFormatter();
  const licenseKey = url.searchParams.get('licenseKey');

  return {
    meta: {
      title: $t('buy'),
    },
    licenseKey,
  };
}) satisfies PageLoad;
