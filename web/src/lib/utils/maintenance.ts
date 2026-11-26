import { Route } from '#lib/route.ts';

export function maintenanceCreateUrl(url: URL) {
  return new URL(Route.maintenanceMode({ continue: url.pathname + url.search }), url.origin).href;
}

export function maintenanceReturnUrl(searchParams: URLSearchParams) {
  return Route.continue(searchParams.get('continue'), '/');
}

export function maintenanceShouldRedirect(maintenanceMode: boolean, currentUrl: URL | Location) {
  return maintenanceMode !== currentUrl.pathname.startsWith(Route.maintenanceMode());
}
