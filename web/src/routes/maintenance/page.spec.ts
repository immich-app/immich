import { websocketStore } from '#lib/stores/websocket.ts';
import { test } from '#test/unit/fixtures.ts';
import { MaintenanceAction } from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { get } from 'svelte/store';
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

test('retries the status while the server is unavailable', async ({ data, render, api }) => {
  data.setMaintenanceStatus({ action: MaintenanceAction.End, active: false });
  let attempts = 0;
  api.on({
    getMaintenanceStatus: () => (++attempts === 1 ? { status: 503 } : { json: data.getMaintenanceStatus() }),
  });
  history.replaceState({}, '', '?token=secret');

  try {
    await render(Page, load);

    expect(api.maintenanceLogin).toHaveBeenCalledWith({ body: { token: 'secret' } });
    expect(attempts).toBe(2);
    expect(get(websocketStore.serverRestarting)).toEqual({ isMaintenanceMode: false });
  } finally {
    websocketStore.serverRestarting.set(undefined);
  }
});

test('reports the server restart once maintenance has ended', async ({ data, render, api }) => {
  data.setMaintenanceStatus({ action: MaintenanceAction.End, active: false });
  history.replaceState({}, '', '?token=secret');

  try {
    await render(Page, load);

    expect(api.maintenanceLogin).toHaveBeenCalledWith({ body: { token: 'secret' } });
    expect(get(websocketStore.serverRestarting)).toEqual({ isMaintenanceMode: false });
  } finally {
    websocketStore.serverRestarting.set(undefined);
  }
});

test('renders without a toast when the login fails', async ({ render, api, app }) => {
  const danger = vi.spyOn(toastManager, 'danger');
  api.on({ maintenanceLogin: () => ({ status: 401, json: { message: 'Invalid token', statusCode: 401 } }) });
  history.replaceState({}, '', '?token=invalid');
  await render(Page, load);

  expect(api.maintenanceLogin).toHaveBeenCalledWith({ body: { token: 'invalid' } });
  await expect.element(app.maintenanceMode.title).toBeVisible();
  await expect.element(app.maintenanceMode.endButton).not.toBeInTheDocument();
  expect(danger).not.toHaveBeenCalled();
});

test('lists the database backups to restore from', async ({ data, render, settle, api, app }) => {
  const filename = 'immich-db-backup-20260324T110000-v1.2.3-snapshot.sql.gz';
  data.backups.backups.push({ filename, filesize: 1024, timezone: 'UTC' });
  data.setMaintenanceStatus({ action: MaintenanceAction.SelectDatabaseRestore, active: true });
  history.replaceState({}, '', '?token=secret');
  await render(Page, load);
  await app.maintenanceMode.databaseBackupButton.click();

  await app.maintenanceMode.nextButton.click();
  await settle();

  expect(api.maintenanceLogin).toHaveBeenCalledWith({ body: { token: 'secret' } });
  expect(api.listDatabaseBackups).toHaveBeenCalled();
  await expect.element(app.admin.maintenance.backup(filename)).toBeVisible();
});

const currentBackup = 'immich-db-backup-20260324T110000-v2.2.3-snapshot.sql.gz';

test('accepts backups from the current server version', async ({ data, render, settle, api, app }) => {
  data.backups.backups.push({ filename: currentBackup, filesize: 1024, timezone: 'UTC' });
  data.setMaintenanceStatus({ action: MaintenanceAction.SelectDatabaseRestore, active: true });
  history.replaceState({}, '', '?token=secret');
  await render(Page, load);
  await app.maintenanceMode.databaseBackupButton.click();

  await app.maintenanceMode.nextButton.click();
  await settle();

  expect(api.maintenanceLogin).toHaveBeenCalledWith({ body: { token: 'secret' } });
  await expect.element(app.admin.maintenance.backup(currentBackup)).toBeVisible();
  await expect.element(app.admin.maintenance.differentVersionWarning).not.toBeInTheDocument();
});

test('flags every backup when the server version is unknown', async ({ data, render, settle, api, app }) => {
  api.on({ getServerVersion: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });
  data.backups.backups.push({ filename: currentBackup, filesize: 1024, timezone: 'UTC' });
  data.setMaintenanceStatus({ action: MaintenanceAction.SelectDatabaseRestore, active: true });
  history.replaceState({}, '', '?token=secret');
  await render(Page, load);
  await app.maintenanceMode.databaseBackupButton.click();

  await app.maintenanceMode.nextButton.click();
  await settle();

  expect(api.maintenanceLogin).toHaveBeenCalledWith({ body: { token: 'secret' } });
  expect(api.getServerVersion).toHaveBeenCalled();
  await expect.element(app.admin.maintenance.backup(currentBackup)).toBeVisible();
  await expect.element(app.admin.maintenance.differentVersionWarning).toBeVisible();
});
