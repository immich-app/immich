/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = globalThis as unknown as ServiceWorkerGlobalScope;
import { build, files, version } from '$service-worker';

const pendingLoads = new Map<string, AbortController>();
const useCache = true;
// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const APP_RESOURCES = [
  ...build, // the app itself
  ...files, // everything in `static`
];

sw.addEventListener('install', (event) => {
  event.waitUntil(sw.skipWaiting());
  // Create a new cache and add all files to it
  event.waitUntil(addFilesToCache());
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(sw.clients.claim());
  // Remove previous cached data from disk
  event.waitUntil(deleteOldCaches());
});

sw.addEventListener('fetch', (event) => {
  // ignore POST requests etc
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (APP_RESOURCES.includes(url.pathname)) {
    event.respondWith(appResources(url, event));
  } else if (/^\/api\/assets\/[a-f0-9-]+\/(original|thumbnail)/.test(url.pathname)) {
    event.respondWith(immichAsset(url));
  }
});

async function deleteOldCaches() {
  for (const key of await caches.keys()) {
    if (key !== CACHE) await caches.delete(key);
  }
}

async function addFilesToCache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(APP_RESOURCES);
}

async function immichAsset(url: URL) {
  const cache = await caches.open(CACHE);
  let response = useCache ? await cache.match(url) : undefined;
  if (!response) {
    try {
      const cancelToken = new AbortController();
      const request = fetch(url, {
        signal: cancelToken.signal,
      });
      pendingLoads.set(url.toString(), cancelToken);
      response = await request;
      if (!(response instanceof Response)) {
        throw new TypeError('invalid response from fetch');
      }
      if (response.status === 200) {
        cache.put(url, response.clone());
      }
    } catch (error) {
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      if ((error as any).name !== 'AbortError') {
        throw error;
      }
    } finally {
      pendingLoads.delete(url.toString());
    }
  }
  return response as Response;
}

async function appResources(url: URL, event: FetchEvent) {
  const cache = await caches.open(CACHE);
  // `build`/`files` can always be served from the cache
  if (APP_RESOURCES.includes(url.pathname)) {
    const response = await cache.match(url.pathname);
    if (response) {
      return response;
    }
  }
  // for everything else, try the network first, but
  // fall back to the cache if we're offline
  try {
    const response = await fetch(event.request);
    // if we're offline, fetch can return a value that is not a Response
    // instead of throwing - and we can't pass this non-Response to respondWith
    if (!(response instanceof Response)) {
      throw new TypeError('invalid response from fetch');
    }

    if (response.status === 200) {
      cache.put(event.request, response.clone());
    }

    return response;
  } catch (error) {
    const response = await cache.match(event.request);
    if (response) {
      return response;
    }
    // if there's no cache, then just error out
    // as there is nothing we can do to respond to this request
    throw error;
  }
}

const broadcast = new BroadcastChannel('immich');
// eslint-disable-next-line  unicorn/prefer-add-event-listener
broadcast.onmessage = (event) => {
  if (!event.data) {
    return;
  }
  if (event.data.type === 'cancel') {
    const urlstring = event.data.url;
    const url = new URL(urlstring, event.origin);

    const pending = pendingLoads.get(url.toString());
    if (pending) {
      pending.abort();
      pendingLoads.delete(url.toString());
    }
  } else if (event.data.type === 'preload') {
    const urlstring = event.data.url;
    const url = new URL(urlstring, event.origin);
    immichAsset(url);
  }
};
