import { AppRoute } from '$lib/constants';
import { maintenanceAuth as maintenanceAuth$ } from '$lib/stores/maintenance.store';
import { maintenanceLogin } from '@immich/sdk';

export function maintenanceCreateUrl(url: URL) {
  const target = new URL(AppRoute.MAINTENANCE, url.origin);
  target.searchParams.set('continue', url.pathname + url.search);
  return target.href;
}

export function maintenanceReturnUrl(searchParams: URLSearchParams) {
  return searchParams.get('continue') ?? '/';
}

export function maintenanceShouldRedirect(maintenanceMode: boolean, currentUrl: URL | Location) {
  return maintenanceMode !== currentUrl.pathname.startsWith(AppRoute.MAINTENANCE);
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
