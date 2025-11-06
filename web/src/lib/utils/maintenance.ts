import { AppRoute } from '$lib/constants';
import { maintenanceAuth as maintenanceAuth$ } from '$lib/stores/maintenance.store';
import { maintenanceLogin } from '@immich/sdk';
import { get } from 'svelte/store';

export function maintenanceCreateUrl(url: URL) {
  const target = new URL(AppRoute.MAINTENANCE, url.origin);
  target.searchParams.set('continue', url.href);
  return target.href;
}

export function maintenanceReturnUrl(searchParams: URLSearchParams, origin: string) {
  const target = new URL(searchParams.get('continue') ?? '/', origin);
  return new URL(target.pathname + target.search + target.hash, origin).href;
}

export const loadMaintenanceAuth = async () => {
  try {
    const maintenanceAuth = get(maintenanceAuth$);

    const query = new URLSearchParams(location.search);
    const queryToken = query.get('token');

    if (!maintenanceAuth || queryToken) {
      const cookie = document.cookie
        .split(';')
        .map((cookie) => cookie.split('=', 2).map((value) => value.trim()))
        .find(([name]) => name === 'immich_maintenance_token');

      const token = queryToken ?? cookie?.[1];

      if (token) {
        try {
          const auth = await maintenanceLogin({
            maintenanceLoginDto: {
              token,
            },
          });

          console.info(auth);

          maintenanceAuth$.set(auth);
        } catch (error) {
          void error;
        }
      }
    }

    return maintenanceAuth;
  } catch {
    return null;
  }
};
