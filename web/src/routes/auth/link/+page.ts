import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  const email = url.searchParams.get('email') || '';
  const reLinkToken = url.searchParams.get('token') || '';

  const $t = await getFormatter();
  return {
    meta: {
      title: $t('link_to_oauth'),
    },
    email,
    reLinkToken,
  };
}) satisfies PageLoad;
