import { getApiKeysQuery } from '#lib/queries/api-key.query.js';
import { queryClient } from '#lib/queries/client.js';
import { searchPasskeysQuery } from '#lib/queries/passkey.query.js';
import { getSessionsQuery } from '#lib/queries/session.query.js';
import { authenticate } from '#lib/utils/auth.js';
import { getFormatter } from '#lib/utils/i18n.js';
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
