import { build, files, version } from '$service-worker';

const useCache = true;
const CACHE = `cache-${version}`;

export const APP_RESOURCES = [
  ...build, // the app itself
  ...files, // everything in `static`
];

export const isURL = (request: URL | RequestInfo): request is URL => (request as URL).href !== undefined;
export const isRequest = (request: RequestInfo): request is Request => (request as Request).url !== undefined;

export async function deleteOldCaches() {
  for (const key of await caches.keys()) {
    if (key !== CACHE) {
      await caches.delete(key);
    }
  }
}

export async function addFilesToCache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(APP_RESOURCES);
}

const pendingLoads = new Map<string, AbortController>();

export async function cancelLoad(urlString: string) {
  const pending = pendingLoads.get(urlString);
  if (pending) {
    pending.abort();
    pendingLoads.delete(urlString);
  }
}

export async function getCachedOrFetch(request: URL | Request | string, cancelable: boolean = false) {
  const cached = await checkCache(request);
  if (cached.response) {
    return cached.response;
  }

  try {
    if (!cancelable) {
      const response = await fetch(request);
      checkResponse(response);
      return response;
    }

    return await fetchWithCancellation(request, cached.cache);
  } catch {
    return new Response(undefined, {
      status: 499,
      statusText: 'Request canceled: Instructions unclear, accidentally interrupted myself',
    });
  }
}

async function fetchWithCancellation(request: URL | Request | string, cache: Cache) {
  const cacheKey = getCacheKey(request);
  const cancelToken = new AbortController();

  try {
    pendingLoads.set(cacheKey, cancelToken);
    const response = await fetch(request, {
      signal: cancelToken.signal,
    });

    checkResponse(response);
    setCached(response, cache, cacheKey);
    return response;
  } finally {
    pendingLoads.delete(cacheKey);
  }
}

async function checkCache(url: URL | Request | string) {
  const cache = await caches.open(CACHE);
  const response = useCache ? await cache.match(url) : undefined;
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
