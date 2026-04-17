import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  const oauthLinkToken = url.searchParams.get('oauthLinkToken') || '';
  const email = url.searchParams.get('email') || '';

  const $t = await getFormatter();
  return {
    meta: {
      title: $t('link_to_oauth'),
    },
    oauthLinkToken,
    email,
  };
}) satisfies PageLoad;
