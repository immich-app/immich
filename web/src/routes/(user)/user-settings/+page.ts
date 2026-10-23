import { getApiKeysQuery } from '$lib/queries/api-key.query';
import { queryClient } from '$lib/queries/client';
import { searchPasskeysQuery } from '$lib/queries/passkey.query';
import { getSessionsQuery } from '$lib/queries/session.query';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  const [$t] = await Promise.all([
    getFormatter(),
    queryClient.query(getApiKeysQuery()),
    queryClient.query(getSessionsQuery()),
    queryClient.query(searchPasskeysQuery()),
  ]);

  return {
    meta: {
      title: $t('settings'),
    },
  };
}) satisfies PageLoad;
