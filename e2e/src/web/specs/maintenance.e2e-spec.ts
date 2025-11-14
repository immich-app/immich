import { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe.configure({ mode: 'serial' });

test.describe('Maintenance', () => {
  let cookie: string | undefined;
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  test('enable maintenance mode', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/admin/system-settings?isOpen=maintenance');
    await page.getByRole('button', { name: 'Start maintenance mode' }).click();

    await page.waitForURL('/maintenance?**');
    await expect(page.getByText('Temporarily Unavailable')).toBeVisible();

    const cookies = await context.cookies(page.url());
    cookie = cookies.find(({ name }) => name === 'immich_maintenance_token')?.value;
    expect(cookie).toBeTruthy();
  });

  test('other users see maintenance mode but no options', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('/maintenance?**');
    await expect(page.getByText('Temporarily Unavailable')).toBeVisible();
    await expect(page.getByRole('button', { name: 'End maintenance mode' })).toHaveCount(0);
  });

  test('we can authenticate by setting token in URL', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('/maintenance?**');
    await expect(page.getByText('Temporarily Unavailable')).toBeVisible();
    await expect(page.getByRole('button', { name: 'End maintenance mode' })).toHaveCount(0);

    await page.goto(`/maintenance?${new URLSearchParams({ token: cookie! })}`);
    await expect(page.getByRole('button', { name: 'End maintenance mode' })).toBeVisible();
  });

  test('disable maintenance mode', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await utils.setMaintenanceAuthCookie(context, cookie!);

    await page.goto('/');
    await page.waitForURL('/maintenance?**');

    await page.getByRole('button', { name: 'End maintenance mode' }).click();
    await page.waitForURL('/photos');
  });

  test('redirect users back to what they were doing', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/admin/system-settings?isOpen=maintenance');
    await page.getByRole('button', { name: 'Start maintenance mode' }).click();
    await page.waitForURL('/maintenance?**');

    await page.goto('/explore');
    await page.waitForURL(`/maintenance?${new URLSearchParams({ continue: '/explore' })}`);
    await page.getByRole('button', { name: 'End maintenance mode' }).click();
    await page.waitForURL('/explore');
  });
});
