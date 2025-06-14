/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { installBroadcastChannelListener } from './broadcast-channel';
import { addFilesToCache, deleteOldCaches } from './cache';
import { handleFetchEvent } from './fetch-event';

const sw = globalThis as unknown as ServiceWorkerGlobalScope;

const handleActivate = (event: ExtendableEvent) => {
  event.waitUntil(sw.clients.claim());
  // Remove previous cached data from disk
  event.waitUntil(deleteOldCaches());
};

const handleInstall = (event: ExtendableEvent) => {
  event.waitUntil(sw.skipWaiting());
  // Create a new cache and add all files to it
  event.waitUntil(addFilesToCache());
};

sw.addEventListener('install', handleInstall, { passive: true });
sw.addEventListener('activate', handleActivate, { passive: true });
sw.addEventListener('fetch', handleFetchEvent, { passive: true });
installBroadcastChannelListener();
