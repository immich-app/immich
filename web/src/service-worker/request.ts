import { get, put } from './cache';

const pendingRequests = new Map<string, { abort: AbortController; callbacks: ((canceled: boolean) => void)[] }>();

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

const canceledResponse = () => {
  // dummy response avoids network errors in the console for these requests
  return new Response(undefined, { status: 204 });
};

export const handleRequest = async (request: URL | Request) => {
  const cacheKey = getCacheKey(request);
  const cachedResponse = await get(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  let canceled = false;
  try {
    const requestSignals = pendingRequests.get(cacheKey);
    if (requestSignals) {
      const canceled = await new Promise<boolean>((resolve) => requestSignals.callbacks.push(resolve));
      if (canceled) {
        return canceledResponse();
      }
      const cachedResponse = await get(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    const cancelToken = new AbortController();
    pendingRequests.set(cacheKey, { abort: cancelToken, callbacks: [] });
    const response = await fetch(request, { signal: cancelToken.signal });

    assertResponse(response);
    await put(cacheKey, response);

    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      canceled = true;
      return canceledResponse();
    }

    console.log('Not an abort error', error);

    throw error;
  } finally {
    const requestSignals = pendingRequests.get(cacheKey);
    pendingRequests.delete(cacheKey);
    if (requestSignals) {
      for (const callback of requestSignals.callbacks) {
        callback(canceled);
      }
    }
  }
};

export const handleCancel = (url: URL) => {
  const cacheKey = getCacheKey(url);
  const requestSignals = pendingRequests.get(cacheKey);
  if (!requestSignals) {
    return;
  }

  requestSignals.abort.abort();
};
