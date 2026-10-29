import { configureYucca } from '@futo-org/backups-orchestrator-ui';
import { commandPaletteManager } from '@immich/ui';
import { goto } from '$app/navigation';
import { languageManager } from '$lib/managers/language-manager.svelte';
import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
import { maintenanceCreateUrl, maintenanceReturnUrl, maintenanceShouldRedirect } from '$lib/utils/maintenance';
import { lang } from '$lib/stores/preferences.store';
import { convertBCP47 } from '$lib/utils/i18n';
import { init } from '$lib/utils/server';
import { get } from 'svelte/store';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const csr = true;

export const load = (async ({ fetch, url }) => {
  configureYucca({ api: 'orchestrator', language: convertBCP47(get(lang)) });

  let error;
  try {
    await init(fetch);

    if (maintenanceShouldRedirect(serverConfigManager.value.maintenanceMode, url)) {
      await goto(
        serverConfigManager.value.maintenanceMode ? maintenanceCreateUrl(url) : maintenanceReturnUrl(url.searchParams),
      );
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
