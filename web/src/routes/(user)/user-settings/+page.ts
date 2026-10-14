import { getApiKeys, getPublicConfig, getSessions, searchPasskeys } from '@immich/sdk';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  const publicConfig = await getPublicConfig();
  const [keys, sessions, passkeys, $t] = await Promise.all([
    getApiKeys(),
    getSessions(),
    publicConfig.passkey.enabled ? searchPasskeys({}) : Promise.resolve([]),
    getFormatter(),
  ]);

  return {
    keys,
    sessions,
    passkeys,
    publicConfig,
    meta: {
      title: $t('settings'),
    },
  };
}) satisfies PageLoad;
