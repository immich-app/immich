import { env } from '$env/dynamic/public';
import { defaults } from '@immich/sdk';

const wait = (ms: number) => new Promise((_, reject) => setTimeout(reject, ms));

const tryServers = async (fetchFn: typeof fetch) => {
  const server_urls_env = env.PUBLIC_SERVER_URLS;
  if (server_urls_env) {
    const servers = server_urls_env.split(',');
    // servers are in priority order, try in parallel, use first success
    const fetchers = servers.map((url) => ({ url, fetcher: fetchFn(`${url}/server-info/config`) }));
    for (const { url, fetcher } of fetchers) {
      try {
        const response = (await Promise.race([fetcher, wait(1000)])) as Response;
        if (response?.ok) {
          defaults.basePath = url;
          return true;
        }
      } catch {
        // ignore, handled upstream
      }
    }
  }

  return false;
};

export async function initSDK(fetcher: typeof fetch) {
  // set event.fetch on the fetch-client used by @immich/sdk
  // https://kit.svelte.dev/docs/load#making-fetch-requests
  // https://github.com/oazapfts/oazapfts/blob/main/README.md#fetch-options
  defaults.fetch = fetcher;
  try {
    await Promise.race([tryServers(fetcher), wait(5000)]);
  } catch {
    throw 'Could not connect to any server';
  }
}
