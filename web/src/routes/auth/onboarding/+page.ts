import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('onboarding'),
    },
  };
}) satisfies PageLoad;
