import { get, put } from './cache';

const isURL = (request: URL | RequestInfo): request is URL => (request as URL).href !== undefined;
const isRequest = (request: RequestInfo): request is Request => (request as Request).url !== undefined;

const assertResponse = (response: Response) => {
  if (!(response instanceof Response)) {
    throw new TypeError('Fetch did not return a valid Response object');
  }
};

const getCacheKey = (request: URL | Request) => {
  if (isURL(request)) {
    return request.toString();
  }

  if (isRequest(request)) {
    return request.url;
  }

  throw new Error(`Invalid request: ${request}`);
};

const pendingRequests = new Map<string, AbortController>();

export const handleRequest = async (request: URL | Request) => {
  const cacheKey = getCacheKey(request);

  const cachedResponse = await get(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const cancelToken = new AbortController();
    pendingRequests.set(cacheKey, cancelToken);
    const response = await fetch(request, { signal: cancelToken.signal });

    assertResponse(response);
    put(cacheKey, response);

    return response;
  } catch (error) {
    console.log(error);
    return new Response(undefined, {
      status: 499,
      statusText: `Request canceled: Instructions unclear, accidentally interrupted myself (${error})`,
    });
  } finally {
    pendingRequests.delete(cacheKey);
  }
};

export const cancelRequest = (url: URL) => {
  const cacheKey = getCacheKey(url);
  const pending = pendingRequests.get(cacheKey);
  if (!pending) {
    return;
  }

  pending.abort();
  pendingRequests.delete(cacheKey);
};
