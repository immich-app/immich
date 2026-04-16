import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  const linkToken = url.searchParams.get('linkToken') || '';
  const email = url.searchParams.get('email') || '';

  const $t = await getFormatter();
  return {
    meta: {
      title: $t('link_to_oauth'),
    },
    linkToken,
    email,
  };
}) satisfies PageLoad;
