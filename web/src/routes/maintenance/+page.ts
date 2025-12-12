import { loadMaintenanceAuth } from '$lib/utils/maintenance';
import type { PageLoad } from '../admin/$types';

export const load = (async () => {
  await loadMaintenanceAuth();
}) satisfies PageLoad;
