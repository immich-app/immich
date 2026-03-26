import type { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Map FilterPanel', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  async function gotoMap(context: import('@playwright/test').BrowserContext, page: import('@playwright/test').Page) {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/map');
    await page.waitForSelector('[data-testid="discovery-panel"], [data-testid="collapsed-icon-strip"]');
  }

  test('should show filter panel on map page', async ({ context, page }) => {
    await gotoMap(context, page);
    await expect(page.getByTestId('discovery-panel')).toBeVisible();
  });

  test('should collapse and expand filter panel', async ({ context, page }) => {
    await gotoMap(context, page);

    await expect(page.getByTestId('discovery-panel')).toBeVisible();

    await page.getByTestId('collapse-panel-btn').click();
    await expect(page.getByTestId('collapsed-icon-strip')).toBeVisible();

    await page.getByTestId('expand-panel-btn').click();
    await expect(page.getByTestId('discovery-panel')).toBeVisible();
  });

  test('should show favorites filter section', async ({ context, page }) => {
    await gotoMap(context, page);
    await expect(page.getByTestId('favorites-filter')).toBeVisible();
  });

  test('should not show location filter section on map', async ({ context, page }) => {
    await gotoMap(context, page);
    await expect(page.getByTestId('filter-section-location')).not.toBeVisible();
  });
});
