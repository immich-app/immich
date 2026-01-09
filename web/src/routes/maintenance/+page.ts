import { loadMaintenanceAuth, loadMaintenanceStatus } from '$lib/utils/maintenance';
import type { PageLoad } from '../admin/$types';

export const load = (async () => {
  await Promise.allSettled([loadMaintenanceAuth(), loadMaintenanceStatus()]);
}) satisfies PageLoad;
