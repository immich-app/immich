import { loadMaintenanceAuth, loadMaintenanceStatus } from '$lib/utils/maintenance';
import { getServerVersion } from '@immich/sdk';
import type { PageLoad } from '../admin/$types';

export const load = (async () => {
  await Promise.allSettled([loadMaintenanceAuth(), loadMaintenanceStatus()]);

  try {
    const { major, minor, patch } = await getServerVersion();
    return { expectedVersion: `${major}.${minor}.${patch}` };
  } catch {
    return { expectedVersion: '0.0.0' };
  }
}) satisfies PageLoad;
