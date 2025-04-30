/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { version } from '$service-worker';

const useCache = true;
const sw = globalThis as unknown as ServiceWorkerGlobalScope;
const pendingLoads = new Map<string, AbortController>();

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

sw.addEventListener('install', (event) => {
  event.waitUntil(sw.skipWaiting());
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
  if (/^\/api\/assets\/[a-f0-9-]+\/(original|thumbnail)/.test(url.pathname)) {
    event.respondWith(immichAsset(url));
  }
});

async function deleteOldCaches() {
  for (const key of await caches.keys()) {
    if (key !== CACHE) {
      await caches.delete(key);
    }
  }
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
