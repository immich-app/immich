import { Route } from '$lib/route';
import { maintenanceStore } from '$lib/stores/maintenance.store';
import { websocketStore } from '$lib/stores/websocket';
import { getMaintenanceStatus, MaintenanceAction, maintenanceLogin } from '@immich/sdk';

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

    maintenanceStore.auth.set(auth);
  } catch {
    // silently fail
  }
};

export const loadMaintenanceStatus = async () => {
  while (true) {
    try {
      const status = await getMaintenanceStatus();
      maintenanceStore.status.set(status);

      if (status.action === MaintenanceAction.End) {
        websocketStore.serverRestarting.set({
          isMaintenanceMode: false,
        });
      }

      break;
    } catch (error) {
      const status = (error as { status: number })?.status;
      if (status && status >= 500 && status < 600) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      throw error;
    }
  }
};
