import { Route } from '$lib/route';
import { maintenanceAuth as maintenanceAuth$ } from '$lib/stores/maintenance.store';
import { maintenanceLogin } from '@immich/sdk';

export function maintenanceCreateUrl(url: URL) {
  return new URL(Route.maintenanceMode({ continue: url.pathname + url.search }), url.origin).href;
}

export function maintenanceReturnUrl(searchParams: URLSearchParams) {
  return searchParams.get('continue') ?? '/';
}

export function maintenanceShouldRedirect(maintenanceMode: boolean, currentUrl: URL | Location) {
  return maintenanceMode !== currentUrl.pathname.startsWith(Route.maintenanceMode());
}

export const loadMaintenanceAuth = async () => {
  const query = new URLSearchParams(location.search);

  try {
    const auth = await maintenanceLogin({
      maintenanceLoginDto: {
        token: query.get('token') ?? undefined,
      },
    });

    maintenanceAuth$.set(auth);
  } catch {
    // silently fail
  }
};
