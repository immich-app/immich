/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

type PendingRequest = {
  controller: AbortController;
  promise: Promise<Response>;
  cleanupTimeout?: ReturnType<typeof setTimeout>;
};

const pendingRequests = new Map<string, PendingRequest>();

const getRequestKey = (request: URL | Request): string => (request instanceof URL ? request.href : request.url);

const CANCELATION_MESSAGE = 'Request canceled by application';
const CLEANUP_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export const handleFetch = (request: URL | Request): Promise<Response> => {
  const requestKey = getRequestKey(request);
  const existing = pendingRequests.get(requestKey);

  if (existing) {
    // Clone the response since response bodies can only be read once
    // Each caller gets an independent clone they can consume
    return existing.promise.then((response) => response.clone());
  }

  const pendingRequest: PendingRequest = {
    controller: new AbortController(),
    promise: undefined as unknown as Promise<Response>,
  };
  pendingRequests.set(requestKey, pendingRequest);

  // NOTE: fetch returns after headers received, not the body
  pendingRequest.promise = fetch(request, { signal: pendingRequest.controller.signal })
    .catch((error: unknown) => {
      const standardError = error instanceof Error ? error : new Error(String(error));
      if (standardError.name === 'AbortError' || standardError.message === CANCELATION_MESSAGE) {
        // dummy response avoids network errors in the console for these requests
        return new Response(undefined, { status: 204 });
      }
      throw standardError;
    })
    .finally(() => {
      // Schedule cleanup after timeout to allow response body streaming to complete
      const cleanupTimeout = setTimeout(() => {
        pendingRequests.delete(requestKey);
      }, CLEANUP_TIMEOUT_MS);
      pendingRequest.cleanupTimeout = cleanupTimeout;
    });

  // Clone for the first caller to keep the original response unconsumed for future callers
  return pendingRequest.promise.then((response) => response.clone());
};

export const handleCancel = (url: URL) => {
  const requestKey = getRequestKey(url);

  const pendingRequest = pendingRequests.get(requestKey);
  if (pendingRequest) {
    pendingRequest.controller.abort(CANCELATION_MESSAGE);
    if (pendingRequest.cleanupTimeout) {
      clearTimeout(pendingRequest.cleanupTimeout);
    }
    pendingRequests.delete(requestKey);
  }
};
