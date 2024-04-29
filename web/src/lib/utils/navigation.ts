import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { AppRoute } from '$lib/constants';
import { getAssetInfo } from '@immich/sdk';
import type { NavigationTarget } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const isExternalUrl = (url: string): boolean => {
  return new URL(url, window.location.href).origin !== window.location.origin;
};

export const isPhotosRoute = (route?: string | null) => !!route?.startsWith('/(user)/photos/[[assetId=id]]');
export const isSharedLinkRoute = (route?: string | null) => !!route?.startsWith('/(user)/share/[key]');
export const isSearchRoute = (route?: string | null) => !!route?.startsWith('/(user)/search');
export const isAlbumsRoute = (route?: string | null) => !!route?.startsWith('/(user)/albums/[albumId=id]');
export const isPeopleRoute = (route?: string | null) => !!route?.startsWith('/(user)/people/[personId]');

export const isAssetViewerRoute = (target?: NavigationTarget | null) =>
  !!(target?.route.id?.endsWith('/[[assetId=id]]') && 'assetId' in (target?.params || {}));

export function getAssetInfoFromParam({ assetId, key }: { assetId?: string; key?: string }) {
  return assetId && getAssetInfo({ id: assetId, key });
}

function currentUrlWithoutAsset() {
  const $page = get(page);
  // This contains special casing for the /photos/:assetId route, which hangs directly
  // off / instead of a subpath, unlike every other asset-containing route.
  return isPhotosRoute($page.route.id)
    ? AppRoute.PHOTOS + $page.url.search
    : $page.url.pathname.replace(/(\/photos.*)$/, '') + $page.url.search;
}

function currentUrlReplaceAssetId(assetId: string) {
  const $page = get(page);
  // this contains special casing for the /photos/:assetId photos route, which hangs directly
  // off / instead of a subpath, unlike every other asset-containing route.
  return isPhotosRoute($page.route.id)
    ? `${AppRoute.PHOTOS}/${assetId}${$page.url.search}`
    : `${$page.url.pathname.replace(/(\/photos.*)$/, '')}/photos/${assetId}${$page.url.search}`;
}

function currentUrl() {
  const $page = get(page);
  const current = $page.url;
  return current.pathname + current.search;
}

interface Route {
  /**
   * The route to target, or 'current' to stay on current route.
   */
  targetRoute: string | 'current';
}

interface AssetRoute extends Route {
  targetRoute: 'current';
  assetId: string | null;
}

function isAssetRoute(route: Route): route is AssetRoute {
  return route.targetRoute === 'current' && 'assetId' in route;
}

async function navigateAssetRoute(route: AssetRoute) {
  const { assetId } = route;
  const next = assetId ? currentUrlReplaceAssetId(assetId) : currentUrlWithoutAsset();
  if (next !== currentUrl()) {
    await goto(next, { replaceState: false });
  }
}

export function navigate<T extends Route>(change: T): Promise<void> {
  if (isAssetRoute(change)) {
    return navigateAssetRoute(change);
  }
  // future navigation requests here
  throw `Invalid navigation: ${JSON.stringify(change)}`;
}

export const clearQueryParam = async (queryParam: string, url: URL) => {
  if (url.searchParams.has(queryParam)) {
    url.searchParams.delete(queryParam);
    await goto(url, { keepFocus: true });
  }
};
