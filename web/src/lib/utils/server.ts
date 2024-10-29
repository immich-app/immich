import { retrieveServerConfig } from '$lib/stores/server-config.store';
import { initLanguage } from '$lib/utils';
import { defaults } from '@immich/sdk';
import { memoize } from 'lodash-es';

type Fetch = typeof fetch;

async function _init(fetch: Fetch) {
  // set event.fetch on the fetch-client used by @immich/sdk
  // https://kit.svelte.dev/docs/load#making-fetch-requests
  // https://github.com/oazapfts/oazapfts/blob/main/README.md#fetch-options
  defaults.fetch = fetch;
  await initLanguage();
  await retrieveServerConfig();
}

export const init = memoize(_init, () => 'singlevalue');
