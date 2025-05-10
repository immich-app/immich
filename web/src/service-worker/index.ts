/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';

const useCache = true;
const sw = globalThis as unknown as ServiceWorkerGlobalScope;
const pendingLoads = new Map<string, AbortController>();

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
  if (event.request.method !== 'GET') {
    return;
  }
  const url = new URL(event.request.url);
  if (APP_RESOURCES.includes(url.pathname)) {
    event.respondWith(appResources(url, event));
  } else if (/^\/api\/assets\/[a-f0-9-]+\/(original|thumbnail)/.test(url.pathname)) {
    event.respondWith(immichAsset(url));
  } else if (
    /^(\/(link|auth|admin|albums|archive|buy|explore|favorites|folders|maps|memory|partners|people|photos|places|search|share|shared-links|sharing|tags|trash|user-settings|utilities))(\/.*)?$/.test(
      url.pathname,
    )
  ) {
    event.respondWith(ssr(new URL(event.request.url).origin));
  }
});

async function deleteOldCaches() {
  for (const key of await caches.keys()) {
    if (key !== CACHE) {
      await caches.delete(key);
    }
  }
}

async function addFilesToCache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(APP_RESOURCES);
}

async function ssr(origin: string) {
  const cache = await caches.open(CACHE);
  const url = new URL('/', origin);
  let response = useCache ? await cache.match(url) : undefined;
  if (response) {
    return response;
  }
  response = await fetch(url);
  if (!(response instanceof Response)) {
    return Response.error();
  }
  if (response.status === 200) {
    cache.put(url, response.clone());
  }
  return response;
}

async function immichAsset(url: URL) {
  const cache = await caches.open(CACHE);
  let response = useCache ? await cache.match(url) : undefined;
  if (response) {
    return response;
  }
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
    return response;
  } catch {
    return Response.error();
  } finally {
    pendingLoads.delete(url.toString());
  }
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
  } catch {
    const response = await cache.match(event.request);
    if (response) {
      return response;
    }
    // if there's no cache, then just error out
    return Response.error();
  }
}

const broadcast = new BroadcastChannel('immich');
// eslint-disable-next-line  unicorn/prefer-add-event-listener
broadcast.onmessage = (event) => {
  if (!event.data) {
    return;
  }
  const urlstring = event.data.url;
  const url = new URL(urlstring, event.origin);
  if (event.data.type === 'cancel') {
    const pending = pendingLoads.get(url.toString());
    if (pending) {
      pending.abort();
      pendingLoads.delete(url.toString());
    }
  } else if (event.data.type === 'preload') {
    immichAsset(url);
  }
};
