import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
import type { LayoutLoad } from './$types';

export const load = (async () => {
  await systemConfigManager.init();
}) satisfies LayoutLoad;
