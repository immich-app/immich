import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { AppRoute } from '$lib/constants';
import { getAssetInfo } from '@immich/sdk';
import { get } from 'svelte/store';

export const isExternalUrl = (url: string): boolean => {
  return new URL(url, window.location.href).origin !== window.location.origin;
};

export const isPhotosRoute = (route?: string | null) => route?.startsWith('/(user)/photos/[[assetId=id]]') || false;
export const isSharedLinkRoute = (route?: string | null) => route?.startsWith('/(user)/share/[key]') || false;
export const isSearchRoute = (route?: string | null) => route?.startsWith('/(user)/search') || false;
export const isAlbumsRoute = (route?: string | null) => route?.startsWith('/(user)/albums/[albumId=id]') || false;
export const isPeopleRoute = (route?: string | null) => route?.startsWith('/(user)/people/[personId]') || false;

export async function getAssetInfoFromParam(params: { assetId?: string }) {
  if (params.assetId) {
    return getAssetInfo({ id: params.assetId });
  }
  return null;
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

function navigateAssetRoute(route: AssetRoute) {
  const { assetId } = route;
  return assetId
    ? void goto(currentUrlReplaceAssetId(assetId), { replaceState: false })
    : void goto(currentUrlWithoutAsset(), { replaceState: false });
}

export function navigate<T extends Route>(change: T) {
  if (isAssetRoute(change)) {
    return navigateAssetRoute(change);
  }
  // future navigation requests here
  throw `Invalid navigation: ${JSON.stringify(change)}`;
}
