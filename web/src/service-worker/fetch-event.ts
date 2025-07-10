import { version } from '$service-worker';
import { APP_RESOURCES, checkCache, getCacheKey, setCached } from './cache';

const CACHE = `cache-${version}`;

export const isURL = (request: URL | RequestInfo): request is URL => (request as URL).href !== undefined;
export const isRequest = (request: RequestInfo): request is Request => (request as Request).url !== undefined;

export async function deleteOldCaches() {
  for (const key of await caches.keys()) {
    if (key !== CACHE) {
      await caches.delete(key);
    }
  }
}

const pendingLoads = new Map<string, AbortController>();

export async function cancelLoad(urlString: string) {
  const pending = pendingLoads.get(urlString);
  if (pending) {
    pending.abort();
    pendingLoads.delete(urlString);
  }
}

export async function getCachedOrFetch(request: URL | Request | string) {
  const response = await checkCache(request);
  if (response) {
    return response;
  }

  try {
    return await fetchWithCancellation(request);
  } catch {
    return new Response(undefined, {
      status: 499,
      statusText: 'Request canceled: Instructions unclear, accidentally interrupted myself',
    });
  }
}

async function fetchWithCancellation(request: URL | Request | string) {
  const cacheKey = getCacheKey(request);
  const cancelToken = new AbortController();

  try {
    pendingLoads.set(cacheKey, cancelToken);
    const response = await fetch(request, {
      signal: cancelToken.signal,
    });

    checkResponse(response);
    setCached(response, cacheKey);
    return response;
  } finally {
    pendingLoads.delete(cacheKey);
  }
}

function checkResponse(response: Response) {
  if (!(response instanceof Response)) {
    throw new TypeError('Fetch did not return a valid Response object');
  }
}

function isIgnoredFileType(pathname: string): boolean {
  return /\.(png|ico|txt|json|ts|ttf|css|js|svelte)$/.test(pathname);
}

function isIgnoredPath(pathname: string): boolean {
  return /^\/(src|api)(\/.*)?$/.test(pathname) || /^\/(node_modules|@vite|@id)(\/.*)?$/.test(pathname);
}
function isAssetRequest(pathname: string): boolean {
  return /^\/api\/assets\/[a-f0-9-]+\/(original|thumbnail)/.test(pathname);
}

export function handleFetchEvent(event: FetchEvent): void {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Only handle requests to the same origin
  if (url.origin !== self.location.origin) {
    return;
  }

  // Do not cache app resources
  if (APP_RESOURCES.includes(url.pathname)) {
    return;
  }

  // Cache requests for thumbnails
  if (isAssetRequest(url.pathname)) {
    event.respondWith(getCachedOrFetch(event.request));
    return;
  }

  // Do not cache ignored file types or paths
  if (isIgnoredFileType(url.pathname) || isIgnoredPath(url.pathname)) {
    return;
  }

  // At this point, the only remaining requests for top level routes
  // so serve the Svelte SPA fallback page
  const slash = new URL('/', url.origin);
  event.respondWith(getCachedOrFetch(slash));
}
