import { setFetch } from '@immich/sdk';
import { memoize } from 'lodash-es';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
import { queryClient } from '$lib/queries/client';
import { getPublicConfigQuery } from '$lib/queries/config-public.query';
import { getServerConfigQuery } from '$lib/queries/server.query';
import { initLanguage } from '$lib/utils';

type Fetch = typeof fetch;

async function _init(fetch: Fetch) {
  // set event.fetch on the fetch-client used by @immich/sdk
  // https://kit.svelte.dev/docs/load#making-fetch-requests
  // https://github.com/oazapfts/oazapfts/blob/main/README.md#fetch-options
  setFetch(fetch);
  await initLanguage();
  const serverConfig = await queryClient.query(getServerConfigQuery());
  await authManager.load();

  if (!serverConfig.maintenanceMode) {
    await Promise.all([queryClient.query(getPublicConfigQuery()), featureFlagsManager.init()]);
  }
}

export const init = memoize(_init, () => 'singlevalue');
