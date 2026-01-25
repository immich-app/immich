import { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe.configure({ mode: 'serial' });

test.describe('Database Backups', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  test('restore a backup from settings', async ({ context, page }) => {
    test.setTimeout(60_000);

    await utils.resetBackups(admin.accessToken);
    const filename = await utils.createBackup(admin.accessToken);
    await utils.setAuthCookies(context, admin.accessToken);

    // work-around until test is running on released version
    await utils.move(
      `/data/backups/${filename}`,
      '/data/backups/immich-db-backup-20260114T184016-v2.5.0-pg14.19.sql.gz',
    );

    await page.goto('/admin/maintenance?isOpen=backups');
    await page.getByRole('button', { name: 'Restore', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Restore' }).click();

    await page.waitForURL('/maintenance?**');
    await page.waitForURL('/admin/maintenance**', { timeout: 60_000 });
  });

  test('handle backup restore failure', async ({ context, page }) => {
    test.setTimeout(60_000);

    await utils.resetBackups(admin.accessToken);
    await utils.prepareTestBackup('corrupted');
    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/admin/maintenance?isOpen=backups');
    await page.getByRole('button', { name: 'Restore', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Restore' }).click();

    await page.waitForURL('/maintenance?**');
    await expect(page.getByText('IM CORRUPTED')).toBeVisible({ timeout: 60_000 });
    await page.getByRole('button', { name: 'End maintenance mode' }).click();
    await page.waitForURL('/admin/maintenance**');
  });

  test('rollback to restore point if backup is missing admin', async ({ context, page }) => {
    test.setTimeout(60_000);

    await utils.resetBackups(admin.accessToken);
    await utils.prepareTestBackup('empty');
    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/admin/maintenance?isOpen=backups');
    await page.getByRole('button', { name: 'Restore', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Restore' }).click();

    await page.waitForURL('/maintenance?**');
    await expect(page.getByText('Server health check failed, no admin exists.')).toBeVisible({ timeout: 60_000 });
    await page.getByRole('button', { name: 'End maintenance mode' }).click();
    await page.waitForURL('/admin/maintenance**');
  });

  test('restore a backup from onboarding', async ({ context, page }) => {
    test.setTimeout(60_000);

    await utils.resetBackups(admin.accessToken);
    const filename = await utils.createBackup(admin.accessToken);
    await utils.setAuthCookies(context, admin.accessToken);

    // work-around until test is running on released version
    await utils.move(
      `/data/backups/${filename}`,
      '/data/backups/immich-db-backup-20260114T184016-v2.5.0-pg14.19.sql.gz',
    );

    await utils.resetDatabase();

    await page.goto('/');
    await page.getByRole('button', { name: 'Restore from backup' }).click();

    try {
      await page.waitForURL('/maintenance**');
    } catch {
      // when chained with the rest of the tests
      // this navigation may fail..? not sure why...
      await page.goto('/maintenance');
      await page.waitForURL('/maintenance**');
    }

    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Restore', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Restore' }).click();

    await page.waitForURL('/maintenance?**');
    await page.waitForURL('/photos', { timeout: 60_000 });
  });
});
