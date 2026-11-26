import { executeMutation, queryClient } from '#lib/queries/client.ts';
import { getMaintenanceStatusQuery, maintenanceLoginMutation } from '#lib/queries/maintenance.query.ts';
import { getServerVersionQuery } from '#lib/queries/server-info.query.ts';
import { websocketStore } from '#lib/stores/websocket.ts';
import { MaintenanceAction } from '@immich/sdk';
import { noop } from 'lodash-es';
import type { PageLoad } from './$types';

export const load = (async () => {
  const token = new URLSearchParams(location.search).get('token') ?? undefined;
  const [auth, status] = await Promise.all([
    executeMutation(maintenanceLoginMutation, [{ maintenanceLoginDto: { token } }]),
    queryClient.query(getMaintenanceStatusQuery()).catch(noop),
  ]);

  if (status?.action === MaintenanceAction.End) {
    websocketStore.serverRestarting.set({ isMaintenanceMode: false });
  }

  const expectedVersion = await queryClient.query(getServerVersionQuery()).catch(() => '0.0.0');
  return { auth, expectedVersion };
}) satisfies PageLoad;
