/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { installBroadcastChannelListener } from './broadcast-channel';
import { deleteOldCaches } from './cache';
import { handleFetchEvent } from './fetch-event';

const sw = globalThis as unknown as ServiceWorkerGlobalScope;

const handleActivate = (event: ExtendableEvent) => {
  event.waitUntil(sw.clients.claim());
  event.waitUntil(deleteOldCaches());
};

const handleInstall = (event: ExtendableEvent) => {
  event.waitUntil(sw.skipWaiting());
  // do not preload app resources
};

sw.addEventListener('install', handleInstall, { passive: true });
sw.addEventListener('activate', handleActivate, { passive: true });
sw.addEventListener('fetch', handleFetchEvent, { passive: true });
installBroadcastChannelListener();
