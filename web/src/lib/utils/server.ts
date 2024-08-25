import { retrieveServerConfig } from '$lib/stores/server-config.store';
import { initLanguage } from '$lib/utils';
import { defaults } from '@immich/sdk';
import { memoize } from 'lodash-es';

type fetchType = typeof fetch;

export function initSDK(fetch: fetchType) {
  // set event.fetch on the fetch-client used by @immich/sdk
  // https://kit.svelte.dev/docs/load#making-fetch-requests
  // https://github.com/oazapfts/oazapfts/blob/main/README.md#fetch-options
  defaults.fetch = fetch;
}

async function _init(fetch: fetchType) {
  initSDK(fetch);
  await initLanguage();
  await retrieveServerConfig();
}

export const init = memoize(_init, () => 'singlevalue');
