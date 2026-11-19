import { Route } from '#lib/route.ts';
import { expect, test } from '#test/medium/fixtures.ts';
import { MaintenanceAction } from '@immich/sdk';

test('shows the restore progress pushed over the websocket', async ({ page, data, api, app }) => {
  data.serverConfig.maintenanceMode = true;
  await page.goto(Route.maintenanceMode());
  await expect(app.maintenanceMode.title).toBeVisible();
  expect(api.maintenanceLogin).toHaveBeenCalledWith({ body: {} });

  await expect(() =>
    api.emit('MaintenanceStatusV1', {
      action: MaintenanceAction.RestoreDatabase,
      active: true,
      progress: 0.5,
      task: 'restore',
    }),
  ).toPass();

  await expect(app.maintenanceMode.restoreTask).toBeVisible();
});
