import { languageManager } from '#lib/managers/language-manager.svelte.ts';
import { readPreloadedQuery } from '#lib/queries/client.ts';
import { getServerConfigQuery } from '#lib/queries/server-info.query.ts';
import { init } from '#lib/utils/client.ts';
import { maintenanceCreateUrl, maintenanceReturnUrl, maintenanceShouldRedirect } from '#lib/utils/maintenance.ts';
import { commandPaletteManager } from '@immich/ui';
import { goto } from '$app/navigation';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const csr = true;

export const load = (async ({ fetch, url }) => {
  let error;
  try {
    await init(fetch);

    const { maintenanceMode } = readPreloadedQuery(getServerConfigQuery());
    if (maintenanceShouldRedirect(maintenanceMode, url)) {
      await goto(maintenanceMode ? maintenanceCreateUrl(url) : maintenanceReturnUrl(url.searchParams));
    }
  } catch (initError) {
    error = initError;
  }

  commandPaletteManager.enable();
  languageManager.init();

  return {
    error,
    meta: {
      title: 'Immich',
    },
  };
}) satisfies LayoutLoad;
