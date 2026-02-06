import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
import { initLanguage } from '$lib/utils';
import { defaults } from '@server/sdk';
type Fetch = typeof fetch;

let _initialized = false;

export async function init(fetch: Fetch) {
  if (_initialized) return;
  _initialized = true;
  // set event.fetch on the fetch-client used by @server/sdk
  // https://kit.svelte.dev/docs/load#making-fetch-requests
  // https://github.com/oazapfts/oazapfts/blob/main/README.md#fetch-options
  defaults.fetch = fetch;
  await initLanguage();
  await serverConfigManager.init();
}
