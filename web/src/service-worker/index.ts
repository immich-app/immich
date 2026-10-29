import { installMessageListener } from './messaging';
import { handleFetch as handleAssetFetch } from './request';

const ASSET_REQUEST_REGEX = /^\/api\/assets\/[a-f0-9-]+\/(original|thumbnail)/;

const sw = globalThis as unknown as ServiceWorkerGlobalScope;

const handleActivate = (event: ExtendableEvent) => {
  event.waitUntil(sw.clients.claim());
};

const handleInstall = (event: ExtendableEvent) => {
  event.waitUntil(sw.skipWaiting());
};

const isImageTagRequest = (event: FetchEvent) =>
  event.request.method === 'GET' && event.request.destination === 'image';

const handleFetch = (event: FetchEvent): void => {
  if (!isImageTagRequest(event)) {
    return;
  }

  // Cache requests for thumbnails
  const url = new URL(event.request.url);
  if (url.origin === globalThis.location.origin && ASSET_REQUEST_REGEX.test(url.pathname)) {
    event.respondWith(handleAssetFetch(event.request));
    return;
  }
};

sw.addEventListener('install', handleInstall, { passive: true });
sw.addEventListener('activate', handleActivate, { passive: true });
sw.addEventListener('fetch', handleFetch, { passive: true });
installMessageListener();
