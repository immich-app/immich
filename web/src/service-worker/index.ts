/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { installBroadcastChannelListener } from './broadcast-channel';
import { prune } from './cache';
import { handleRequest } from './request';

const ASSET_REQUEST_REGEX = /^\/api\/assets\/[a-f0-9-]+\/(original|thumbnail)/;

const sw = globalThis as unknown as ServiceWorkerGlobalScope;

const handleActivate = (event: ExtendableEvent) => {
  event.waitUntil(sw.clients.claim());
  event.waitUntil(prune());
};

const handleInstall = (event: ExtendableEvent) => {
  event.waitUntil(sw.skipWaiting());
  // do not preload app resources
};

const handleFetch = (event: FetchEvent): void => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Cache requests for thumbnails
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin && ASSET_REQUEST_REGEX.test(url.pathname)) {
    event.respondWith(handleRequest(event.request));
    return;
  }
};

sw.addEventListener('install', handleInstall, { passive: true });
sw.addEventListener('activate', handleActivate, { passive: true });
sw.addEventListener('fetch', handleFetch, { passive: true });
installBroadcastChannelListener();
