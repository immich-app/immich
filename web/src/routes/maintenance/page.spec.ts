import { test } from '#test/unit/fixtures.ts';
import { MaintenanceAction } from '@immich/sdk';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

test('logs in with the token from the url', async ({ render, api, app }) => {
  history.replaceState({}, '', '?token=secret');
  await render(Page, load);

  expect(api.maintenanceLogin).toHaveBeenCalledWith({ body: { token: 'secret' } });
  await expect.element(app.maintenanceMode.endButton).toBeVisible();
});

test('ends maintenance mode', async ({ render, settle, api, app }) => {
  history.replaceState({}, '', '?token=secret');
  await render(Page, load);

  await app.maintenanceMode.endButton.click();
  await settle();

  expect(api.maintenanceLogin).toHaveBeenCalledWith({ body: { token: 'secret' } });
  expect(api.setMaintenanceMode).toHaveBeenCalledWith({ body: { action: MaintenanceAction.End } });
});

test('starts restoring from a backup', async ({ render, settle, api, app }) => {
  history.replaceState({}, '', '?token=secret');
  await render(Page, load);

  await app.maintenanceMode.restoreFromBackupButton.click();
  await settle();

  expect(api.maintenanceLogin).toHaveBeenCalledWith({ body: { token: 'secret' } });
  expect(api.setMaintenanceMode).toHaveBeenCalledWith({ body: { action: MaintenanceAction.SelectDatabaseRestore } });
});
