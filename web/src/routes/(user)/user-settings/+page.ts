import { getApiKeysQuery } from '#lib/queries/api-key.query.ts';
import { queryClient } from '#lib/queries/client.ts';
import { searchPasskeysQuery } from '#lib/queries/passkey.query.ts';
import { getSessionsQuery } from '#lib/queries/session.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
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
