import { AssetMediaResponseDto, LoginResponseDto } from '@immich/sdk';
import { Page, expect, test } from '@playwright/test';
import { utils } from 'src/utils';

function imageLocator(page: Page) {
  return page.getByAltText('Image taken on').locator('visible=true');
}
test.describe('Photo Viewer', () => {
  let admin: LoginResponseDto;
  let asset: AssetMediaResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    asset = await utils.createAsset(admin.accessToken);
  });

  test.beforeEach(async ({ context, page }) => {
    // before each test, login as user
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/photos');
    await page.waitForLoadState('networkidle');
  });

  test('initially shows a loading spinner', async ({ page }) => {
    await page.route(`/api/assets/${asset.id}/thumbnail**`, async (route) => {
      // slow down the request for thumbnail, so spinner has chance to show up
      await new Promise((f) => setTimeout(f, 2000));
      await route.continue();
    });
    await page.goto(`/photos/${asset.id}`);
    await page.waitForLoadState('load');
    // this is the spinner
    await page.waitForSelector('svg[role=status]');
    await expect(page.getByTestId('loading-spinner')).toBeVisible();
  });

  test('loads high resolution photo when zoomed', async ({ page }) => {
    await page.goto(`/photos/${asset.id}`);
    await expect.poll(async () => await imageLocator(page).getAttribute('src')).toContain('thumbnail');
    const box = await imageLocator(page).boundingBox();
    expect(box).toBeTruthy();
    const { x, y, width, height } = box!;
    await page.mouse.move(x + width / 2, y + height / 2);
    await page.mouse.wheel(0, -1);
    await expect.poll(async () => await imageLocator(page).getAttribute('src')).toContain('original');
  });

  test('reloads photo when checksum changes', async ({ page }) => {
    await page.goto(`/photos/${asset.id}`);
    await expect.poll(async () => await imageLocator(page).getAttribute('src')).toContain('thumbnail');
    const initialSrc = await imageLocator(page).getAttribute('src');
    await utils.replaceAsset(admin.accessToken, asset.id);
    await expect.poll(async () => await imageLocator(page).getAttribute('src')).not.toBe(initialSrc);
  });
});
