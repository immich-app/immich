import { getServerConfig, LoginResponseDto, MaintenanceAction, setMaintenanceMode } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils.js';

const restartTimeout = 30_000;

test.describe.configure({ mode: 'serial' });

test.describe('Maintenance', () => {
  let admin: LoginResponseDto;
  let maintenanceToken: string | undefined;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  test.afterEach(async ({ context }, testInfo) => {
    if (testInfo.status === testInfo.expectedStatus) {
      return;
    }

    const cookies = await context.cookies();
    const token = cookies.find(({ name }) => name === 'immich_maintenance_token')?.value ?? maintenanceToken;
    await endMaintenance(token);
  });

  test('enter and exit maintenance mode', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/admin/maintenance');
    await page.getByRole('button', { name: 'Switch to maintenance mode' }).click();

    await expect(page.getByText('Temporarily Unavailable')).toBeVisible({ timeout: restartTimeout });
    await page.getByRole('button', { name: 'End maintenance mode' }).click();
    await page.waitForURL('**/admin/maintenance*', { timeout: restartTimeout });
  });

  test('maintenance shows no options to users until they authenticate', async ({ page }) => {
    const setCookie = await utils.enterMaintenance(admin.accessToken);
    const cookie = setCookie
      ?.map((cookie) => cookie.split(';', 1)[0].split('='))
      ?.find(([name]) => name === 'immich_maintenance_token');

    expect(cookie).toBeTruthy();
    maintenanceToken = cookie![1];

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
});

const endMaintenance = async (token?: string) => {
  await expect.poll(getMaintenanceMode, { timeout: restartTimeout }).toBeDefined();
  if (!token || !(await getMaintenanceMode())) {
    return;
  }

  await setMaintenanceMode(
    { setMaintenanceModeDto: { action: MaintenanceAction.End } },
    { headers: { cookie: `immich_maintenance_token=${token}` } },
  );
  await expect.poll(getMaintenanceMode, { timeout: restartTimeout }).toBe(false);
};

const getMaintenanceMode = async () => {
  try {
    const { maintenanceMode } = await getServerConfig();
    return maintenanceMode;
  } catch {
    return;
  }
};
