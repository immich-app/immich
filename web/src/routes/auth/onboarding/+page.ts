import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('onboarding'),
    },
  };
}) satisfies PageLoad;
