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
    event.respondWith(cacheOrFetch(event.request));
    return;
  } else if (/^\/api\/assets\/[a-f0-9-]+\/(original|thumbnail)/.test(url.pathname)) {
    event.respondWith(cacheOrFetch(event.request, true));
    return;
  } else if (/\.(png|ico|txt|json|ts|ttf|css|js|svelte)$/.test(url.pathname)) {
    return;
  } else if (/^\/(src|api)(\/.*)?$/.test(url.pathname)) {
    return;
  } else if (/^\/(node_modules|@vite|@id)(\/.*)?$/.test(url.pathname)) {
    return;
  }
  const slash = new URL('/', new URL(event.request.url).origin);
  event.respondWith(cacheOrFetch(slash));
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

export const isURL = (request: URL | RequestInfo): request is URL => (request as URL).href !== undefined;
export const isRequest = (request: RequestInfo): request is Request => (request as Request).url !== undefined;

async function cacheOrFetch(request: URL | Request | string, cancelable: boolean = false) {
  const cached = await checkCache(request);
  if (cached.response) {
    return cached.response;
  }
  try {
    if (cancelable) {
      const cacheKey = getCacheKey(request);
      try {
        const cancelToken = new AbortController();
        pendingLoads.set(cacheKey, cancelToken);
        const response = await fetch(request, {
          signal: cancelToken.signal,
        });
        checkResponse(response);
        setCached(response, cached.cache, cacheKey);
        return response;
      } finally {
        if (cacheKey !== undefined) {
          pendingLoads.delete(cacheKey);
        }
      }
    } else {
      const response = await fetch(request);
      checkResponse(response);
      return response;
    }
  } catch {
    return new Response(undefined, { status: 499, statusText: 'Request canceled. Still buffering... forever.' });
  }
}

async function checkCache(url: URL | Request | string) {
  const cache = await caches.open(CACHE);
  const response = useCache ? await cache.match(url) : undefined;
  if (response) {
    return { cache, response };
  }
  return { cache, response };
}

async function setCached(response: Response, cache: Cache, cacheKey: URL | Request | string) {
  if (response.status === 200) {
    cache.put(cacheKey, response.clone());
  }
}

function checkResponse(response: Response) {
  if (!(response instanceof Response)) {
    throw new TypeError('invalid response from fetch');
  }
}

function getCacheKey(request: URL | Request | string) {
  if (isURL(request)) {
    return request.toString();
  } else if (isRequest(request)) {
    return request.url;
  } else {
    return request;
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
    cacheOrFetch(event.data);
  }
};
