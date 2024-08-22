import { loadConfig } from '$lib/stores/server-config.store';
import { initApp } from '$lib/utils';
import { defaults } from '@immich/sdk';

type fetchType = typeof fetch;
let initialized = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let initError: any;

export function initSDK(fetch: fetchType) {
  // set event.fetch on the fetch-client used by @immich/sdk
  // https://kit.svelte.dev/docs/load#making-fetch-requests
  // https://github.com/oazapfts/oazapfts/blob/main/README.md#fetch-options
  defaults.fetch = fetch;
}

export async function init(fetch: fetchType) {
  if (initError) {
    throw initError;
  }
  if (initialized) {
    return;
  }
  try {
    initSDK(fetch);
    await initApp();
    await loadConfig();

    initialized = true;
  } catch (error) {
    initError = error;
  }
}
