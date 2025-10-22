import { retrieveServerConfig } from '$lib/stores/server-config.store';
import { AbortError, initLanguage, sleep } from '$lib/utils';
import { defaults } from '@immich/sdk';
import { memoize } from 'lodash-es';

type Fetch = typeof fetch;

const api_server: string = '@IMMICH_API_SERVER@';

const tryServers = async (fetchFn: typeof fetch) => {
  const servers = api_server
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v !== '');
  if (servers.length === 0) {
    return true;
  }
  // servers are in priority order, try in parallel, use first success
  const fetchers = servers.map(async (url: string) => {
    const response = await fetchFn(url + '/server/config');
    if (response.ok) {
      return url;
    }
    throw new AbortError();
  });
  try {
    const urlWinner = await Promise.any(fetchers);
    defaults.baseUrl = urlWinner;
    defaults.fetch = (url, options) => fetchFn(url, { credentials: 'include', ...options });
  } catch (e) {
    console.error(e);
    return false;
  }
};

async function _init(fetch: Fetch) {
  // set event.fetch on the fetch-client used by @immich/sdk
  // https://kit.svelte.dev/docs/load#making-fetch-requests
  // https://github.com/oazapfts/oazapfts/blob/main/README.md#fetch-options
  defaults.fetch = fetch;
  try {
    await Promise.race([tryServers(fetch), sleep(5000)]);
  } catch {
    throw 'Could not connect to any server';
  }
  await initLanguage();
  await retrieveServerConfig();
}

export const init = memoize(_init, () => 'singlevalue');
