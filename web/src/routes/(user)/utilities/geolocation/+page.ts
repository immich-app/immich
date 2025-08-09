import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getQueryValue } from '$lib/utils/navigation';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  const partialDate = getQueryValue('date');
  const $t = await getFormatter();

  return {
    partialDate,
    meta: {
      title: $t('manage_geolocation'),
    },
  };
}) satisfies PageLoad;
