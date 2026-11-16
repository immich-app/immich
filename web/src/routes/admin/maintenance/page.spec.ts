import { test } from '#test/unit/fixtures.ts';
import { IntegrityReport, MaintenanceAction, ManualJobName } from '@immich/sdk';
import { DateTime } from 'luxon';
import { expect } from 'vitest';
import { page } from 'vitest/browser';
import Page from './+page.svelte';
import { load } from './+page.ts';

test('shows the backup time relative to the backup timezone', async ({ data, render, app }) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-03-24T12:00:00Z'));
  data.backups.backups.push({
    filename: 'immich-db-backup-20260324T110000-v1.2.3-snapshot.sql.gz',
    filesize: 1024,
    timezone: 'Asia/Tokyo',
  });
  const relativeTime = DateTime.fromFormat('20260324T110000', "yyyyMMdd'T'HHmmss", { zone: 'Asia/Tokyo' })
    .toLocal()
    .toRelative({ locale: 'en' })!;

  await render(Page, load);
  await app.admin.maintenance.restoreBackupButton.click();

  await expect.element(page.getByText(relativeTime, { exact: true })).toBeVisible();
  vi.useRealTimers();
});

test('starts maintenance mode', async ({ render, settle, api, app }) => {
  await render(Page, load);

  await app.admin.maintenance.startButton.click();
  await settle();

  expect(api.setMaintenanceMode).toHaveBeenCalledWith({ body: { action: MaintenanceAction.Start } });
});

test('checks a single integrity report type', async ({ render, settle, api, app }) => {
  await render(Page, load);

  await app.admin.maintenance.checkButton(IntegrityReport.MissingFile).click();
  await settle();

  expect(api.createJob).toHaveBeenCalledWith({ body: { name: ManualJobName.IntegrityMissingFiles } });
  expect(api.createJob).not.toHaveBeenCalledWith({ body: { name: ManualJobName.IntegrityUntrackedFiles } });
  expect(api.createJob).not.toHaveBeenCalledWith({ body: { name: ManualJobName.IntegrityChecksumMismatch } });
});

test('restores a database backup', async ({ data, render, settle, api, app }) => {
  const filename = 'immich-db-backup-20260324T110000-v1.2.3-snapshot.sql.gz';
  data.backups.backups.push({ filename, filesize: 1024, timezone: 'UTC' });
  await render(Page, load);
  await app.admin.maintenance.restoreBackupButton.click();

  await app.admin.maintenance.backupRestoreButton.click();
  await app.cancelButton.click();
  await settle();

  expect(api.setMaintenanceMode).not.toHaveBeenCalled();

  await app.admin.maintenance.backupRestoreButton.click();
  await app.dialogButton('restore').click();
  await settle();

  expect(api.setMaintenanceMode).toHaveBeenCalledWith({
    body: { action: MaintenanceAction.RestoreDatabase, restoreBackupFilename: filename },
  });
});

test('deletes a database backup', async ({ data, render, settle, api, app }) => {
  const filename = 'immich-db-backup-20260324T110000-v1.2.3-snapshot.sql.gz';
  data.backups.backups.push({ filename, filesize: 1024, timezone: 'UTC' });
  await render(Page, load);
  await app.admin.maintenance.restoreBackupButton.click();

  await app.admin.maintenance.backupMenuButton.click();
  await app.admin.maintenance.deleteMenuItem.click();
  await app.cancelButton.click();
  await settle();

  expect(api.deleteDatabaseBackup).not.toHaveBeenCalled();

  await app.admin.maintenance.backupMenuButton.click();
  await app.admin.maintenance.deleteMenuItem.click();
  await app.dialogButton('delete').click();
  await settle();

  expect(api.deleteDatabaseBackup).toHaveBeenCalledWith({ body: { backups: [filename] } });
  await expect.element(app.admin.maintenance.backup(filename)).not.toBeInTheDocument();
});

test('disables restoring a backup while its delete is pending', async ({ data, render, settle, api, app }) => {
  const filename = 'immich-db-backup-20260324T110000-v1.2.3-snapshot.sql.gz';
  data.backups.backups.push({ filename, filesize: 1024, timezone: 'UTC' });
  const pending = Promise.withResolvers<void>();
  api.on({
    deleteDatabaseBackup: async ({ body }) => {
      await pending.promise;
      data.deleteBackups(body.backups);
      return { status: 200 };
    },
  });
  await render(Page, load);
  await app.admin.maintenance.restoreBackupButton.click();

  await app.admin.maintenance.backupMenuButton.click();
  await app.admin.maintenance.deleteMenuItem.click();
  await app.dialogButton('delete').click();

  await expect.element(app.admin.maintenance.backupRestoreButton).toBeDisabled();
  await expect.element(app.admin.maintenance.backupMenuButton).toBeDisabled();

  pending.resolve();
  await settle();

  expect(api.deleteDatabaseBackup).toHaveBeenCalledWith({ body: { backups: [filename] } });
  await expect.element(app.admin.maintenance.backup(filename)).not.toBeInTheDocument();
});

test('keeps a database backup that fails to delete', async ({ data, render, settle, api, logger, app }) => {
  const filename = 'immich-db-backup-20260324T110000-v1.2.3-snapshot.sql.gz';
  data.backups.backups.push({ filename, filesize: 1024, timezone: 'UTC' });
  api.on({ deleteDatabaseBackup: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });
  await render(Page, load);
  await app.admin.maintenance.restoreBackupButton.click();
  await app.admin.maintenance.backupMenuButton.click();
  await app.admin.maintenance.deleteMenuItem.click();

  await app.dialogButton('delete').click();
  await settle();

  expect(api.deleteDatabaseBackup).toHaveBeenCalledWith({ body: { backups: [filename] } });
  expect(logger.error).toHaveBeenCalledWith(/handleError/);
  await expect.element(app.admin.maintenance.backup(filename)).toBeVisible();
  await expect.element(app.admin.maintenance.backupRestoreButton).toBeEnabled();
});

test('shows an error when a restore fails to start', async ({ data, render, settle, api, logger, app }) => {
  const filename = 'immich-db-backup-20260324T110000-v1.2.3-snapshot.sql.gz';
  data.backups.backups.push({ filename, filesize: 1024, timezone: 'UTC' });
  api.on({ setMaintenanceMode: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });
  await render(Page, load);
  await app.admin.maintenance.restoreBackupButton.click();
  await app.admin.maintenance.backupRestoreButton.click();

  await app.dialogButton('restore').click();
  await settle();

  expect(api.setMaintenanceMode).toHaveBeenCalledWith({
    body: { action: MaintenanceAction.RestoreDatabase, restoreBackupFilename: filename },
  });
  expect(logger.error).toHaveBeenCalledWith(/handleError/);
});
