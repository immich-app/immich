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

    await page.waitForURL(`/maintenance?${new URLSearchParams({ continue: '/admin/system-settings' })}`);
    await expect(page.getByText('Temporarily Unavailable')).toBeVisible();
    await page.getByRole('button', { name: 'End maintenance mode' }).click();
    await page.waitForURL('/admin/system-settings');
  });

  test('maintenance shows no options to users until they authenticate', async ({ page }) => {
    const setCookie = await utils.enterMaintenance(admin.accessToken);
    const cookie = setCookie
      ?.map((cookie) => cookie.split(';')[0].split('='))
      ?.find(([name]) => name === 'immich_maintenance_token');

    expect(cookie).toBeTruthy();

    await expect(async () => {
      await page.goto('/');
      await page.waitForURL('/maintenance?**', {
        timeout: 1e3,
      });
    }).toPass({ timeout: 1e4 });

    await expect(page.getByText('Temporarily Unavailable')).toBeVisible();
    await expect(page.getByRole('button', { name: 'End maintenance mode' })).toHaveCount(0);

    await page.goto(`/maintenance?${new URLSearchParams({ token: cookie![1] })}`);
    await expect(page.getByText('Temporarily Unavailable')).toBeVisible();
    await expect(page.getByRole('button', { name: 'End maintenance mode' })).toBeVisible();
    await page.getByRole('button', { name: 'End maintenance mode' }).click();
    await page.waitForURL('/auth/login');
  });
});
