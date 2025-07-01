import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  const $t = await getFormatter();

  return {
    meta: {
      title: $t('change_password'),
    },
  };
}) satisfies PageLoad;
