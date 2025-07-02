import { build, files, version } from '$service-worker';

const useCache = true;
const CACHE = `cache-${version}`;

export const APP_RESOURCES = [
  ...build, // the app itself
  ...files, // everything in `static`
];

let cache: Cache | undefined;
export async function getCache() {
  if (cache) {
    return cache;
  }
  cache = await caches.open(CACHE);
  return cache;
}

export const isURL = (request: URL | RequestInfo): request is URL => (request as URL).href !== undefined;
export const isRequest = (request: RequestInfo): request is Request => (request as Request).url !== undefined;

export async function deleteOldCaches() {
  for (const key of await caches.keys()) {
    if (key !== CACHE) {
      await caches.delete(key);
    }
  }
}

const pendingRequests = new Map<string, AbortController>();
const canceledRequests = new Set<string>();

export async function cancelLoad(urlString: string) {
  const pending = pendingRequests.get(urlString);
  if (pending) {
    canceledRequests.add(urlString);
    pending.abort();
    pendingRequests.delete(urlString);
  }
}

export async function getCachedOrFetch(request: URL | Request | string) {
  const response = await checkCache(request);
  if (response) {
    return response;
  }

  const urlString = getCacheKey(request);
  const cancelToken = new AbortController();

  try {
    pendingRequests.set(urlString, cancelToken);
    const response = await fetch(request, {
      signal: cancelToken.signal,
    });

    checkResponse(response);
    await setCached(response, urlString);
    return response;
  } catch (error) {
    if (canceledRequests.has(urlString)) {
      canceledRequests.delete(urlString);
      return new Response(undefined, {
        status: 499,
        statusText: 'Request canceled: Instructions unclear, accidentally interrupted myself',
      });
    }
    throw error;
  } finally {
    pendingRequests.delete(urlString);
  }
}

export async function checkCache(url: URL | Request | string) {
  if (!useCache) {
    return;
  }
  const cache = await getCache();
  return await cache.match(url);
}

export async function setCached(response: Response, cacheKey: URL | Request | string) {
  if (cache && response.status === 200) {
    const cache = await getCache();
    cache.put(cacheKey, response.clone());
  }
}

function checkResponse(response: Response) {
  if (!(response instanceof Response)) {
    throw new TypeError('Fetch did not return a valid Response object');
  }
}

export function getCacheKey(request: URL | Request | string) {
  if (isURL(request)) {
    return request.toString();
  } else if (isRequest(request)) {
    return request.url;
  } else {
    return request;
  }
}
