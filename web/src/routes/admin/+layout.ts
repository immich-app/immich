// Removed systemConfigManager from layout to fix issue with system config not being loaded in the admin page
// This is because this data is not available for PixelUnion users
// import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
import type { LayoutLoad } from './$types';

export const load = (async () => {
  // await systemConfigManager.init();
}) satisfies LayoutLoad;
