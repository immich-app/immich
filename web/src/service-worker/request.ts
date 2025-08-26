import { get, put } from './cache';

const pendingRequests = new Map<string, AbortController>();

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

export const handlePreload = async (request: URL | Request) => {
  try {
    return await handleRequest(request);
  } catch (error) {
    console.error(`Preload failed: ${error}`);
  }
};

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
    if (error.name === 'AbortError') {
      // dummy response avoids network errors in the console for these requests
      return new Response(undefined, { status: 204 });
    }

    console.log('Not an abort error', error);

    throw error;
  } finally {
    pendingRequests.delete(cacheKey);
  }
};

export const handleCancel = (url: URL) => {
  const cacheKey = getCacheKey(url);
  const pendingRequest = pendingRequests.get(cacheKey);
  if (!pendingRequest) {
    return;
  }

  pendingRequest.abort();
  pendingRequests.delete(cacheKey);
};
