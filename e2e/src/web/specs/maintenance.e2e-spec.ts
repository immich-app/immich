import { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe.configure({ mode: 'serial' });

test.describe('Maintenance', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  test('enter and exit maintenance mode', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/admin/system-settings?isOpen=maintenance');
    await page.getByRole('button', { name: 'Start maintenance mode' }).click();

    await expect(page.getByText('Temporarily Unavailable')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'End maintenance mode' }).click();
    await page.waitForURL('**/admin/system-settings*', { timeout: 10_000 });
  });

  test('maintenance shows no options to users until they authenticate', async ({ page }) => {
    const setCookie = await utils.enterMaintenance(admin.accessToken);
    const cookie = setCookie
      ?.map((cookie) => cookie.split(';')[0].split('='))
      ?.find(([name]) => name === 'immich_maintenance_token');

    expect(cookie).toBeTruthy();

    await expect(async () => {
      await page.goto('/');
      await page.waitForURL('**/maintenance?**', {
        timeout: 1000,
      });
    }).toPass({ timeout: 10_000 });

    await expect(page.getByText('Temporarily Unavailable')).toBeVisible();
    await expect(page.getByRole('button', { name: 'End maintenance mode' })).toHaveCount(0);

    await page.goto(`/maintenance?${new URLSearchParams({ token: cookie![1] })}`);
    await expect(page.getByText('Temporarily Unavailable')).toBeVisible();
    await expect(page.getByRole('button', { name: 'End maintenance mode' })).toBeVisible();
    await page.getByRole('button', { name: 'End maintenance mode' }).click();
    await page.waitForURL('**/auth/login');
  });

  /**
   * restoring backups
   */

  test('restore a backup from settings', async ({ context, page }) => {
    test.setTimeout(60_000);

    await utils.resetBackups(admin.accessToken);
    await utils.createBackup(admin.accessToken);
    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/admin/maintenance?isOpen=backups');
    await page.getByRole('button', { name: 'Restore', exact: true }).click();
    await page.locator('#bits-c2').getByRole('button', { name: 'Restore' }).click();

    await page.waitForURL('/maintenance?**');
    await page.waitForURL('/admin/maintenance**', { timeout: 20_000 });
  });

  test('handle backup restore failure', async ({ context, page }) => {
    test.setTimeout(60_000);

    await utils.resetBackups(admin.accessToken);
    await utils.prepareTestBackup('corrupted');
    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/admin/maintenance?isOpen=backups');
    await page.getByRole('button', { name: 'Restore', exact: true }).click();
    await page.locator('#bits-c2').getByRole('button', { name: 'Restore' }).click();

    await page.waitForURL('/maintenance?**');
    await expect(page.getByText('IM CORRUPTED')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'End maintenance mode' }).click();
    await page.waitForURL('/admin/maintenance**');
  });

  test('restore a backup from onboarding', async ({ context, page }) => {
    test.setTimeout(60_000);

    await utils.resetBackups(admin.accessToken);
    await utils.createBackup(admin.accessToken);
    await utils.setAuthCookies(context, admin.accessToken);
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
    await page.locator('#bits-c2').getByRole('button', { name: 'Restore' }).click();

    await page.waitForURL('/maintenance?**');
    await page.waitForURL('/photos', { timeout: 20_000 });
  });
});
