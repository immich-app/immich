import { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Websocket', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  test('connects using ipv4', async ({ page, context }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('http://127.0.0.1:2285/');
    await expect(page.locator('#sidebar')).toContainText('Server Online');
  });

  test('connects using ipv6', async ({ page, context }) => {
    await utils.setAuthCookies(context, admin.accessToken, '[::1]');
    await page.goto('http://[::1]:2285/');
    await expect(page.locator('#sidebar')).toContainText('Server Online');
  });
});
