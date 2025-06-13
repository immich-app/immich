import { APP_RESOURCES, getCachedOrFetch } from './cache';

function isAssetRequest(pathname: string): boolean {
  return /^\/api\/assets\/[a-f0-9-]+\/(original|thumbnail)/.test(pathname);
}

function isIgnoredFileType(pathname: string): boolean {
  return /\.(png|ico|txt|json|ts|ttf|css|js|svelte)$/.test(pathname);
}

function isIgnoredPath(pathname: string): boolean {
  return /^\/(src|api)(\/.*)?$/.test(pathname) || /^\/(node_modules|@vite|@id)(\/.*)?$/.test(pathname);
}

export function handleFetchEvent(event: FetchEvent): void {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  if (APP_RESOURCES.includes(url.pathname)) {
    event.respondWith(getCachedOrFetch(event.request));
    return;
  }

  if (isAssetRequest(url.pathname)) {
    event.respondWith(getCachedOrFetch(event.request, true));
    return;
  }

  if (isIgnoredFileType(url.pathname) || isIgnoredPath(url.pathname)) {
    return;
  }

  const slash = new URL('/', url.origin);
  event.respondWith(getCachedOrFetch(slash));
}
