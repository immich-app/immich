import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
import { authenticate } from '$lib/utils/auth';
import type { LayoutLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  await systemConfigManager.init();
}) satisfies LayoutLoad;
