import { AssetMediaResponseDto, LoginResponseDto } from '@immich/sdk';
import { Page, expect, test } from '@playwright/test';
import { step } from 'src/step';
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

    step('Setup admin');
    admin = await utils.adminSetup();

    step('Create asset');
    asset = await utils.createAsset(admin.accessToken);
  });

  test.beforeEach(async ({ context, page }) => {
    step('Set authentication cookies for admin');
    await utils.setAuthCookies(context, admin.accessToken);

    step('Navigate to Photos page');
    await page.goto('/photos');

    step('Wait for network to be idle');
    await page.waitForLoadState('networkidle');
  });

  test('initially shows a loading spinner', async ({ page }) => {
    step('Route thumbnail request to slow down');
    await page.route(`/api/assets/${asset.id}/thumbnail**`, async (route) => {
      await new Promise((f) => setTimeout(f, 2000)); // Slow down thumbnail request
      await route.continue();
    });

    step('Navigate to asset page');
    await page.goto(`/photos/${asset.id}`);

    step('Wait for page load');
    await page.waitForLoadState('load');

    step('Check for loading spinner');
    await page.waitForSelector('svg[role=status]');
    await expect(page.getByTestId('loading-spinner')).toBeVisible();
  });

  test('loads high resolution photo when zoomed', async ({ page }) => {
    step('Navigate to asset page');
    await page.goto(`/photos/${asset.id}`);

    step('Check that thumbnail is loaded initially');
    await expect.poll(async () => await imageLocator(page).getAttribute('src')).toContain('thumbnail');

    step('Get image bounding box');
    const box = await imageLocator(page).boundingBox();
    expect(box).toBeTruthy();

    step('Move mouse to center of the image');
    const { x, y, width, height } = box!;
    await page.mouse.move(x + width / 2, y + height / 2);

    step('Zoom in on the image');
    await page.mouse.wheel(0, -1);

    step('Check if high resolution image is loaded');
    await expect.poll(async () => await imageLocator(page).getAttribute('src')).toContain('original');
  });

  test('reloads photo when checksum changes', async ({ page }) => {
    step('Navigate to asset page');
    await page.goto(`/photos/${asset.id}`);

    step('Check that thumbnail is loaded');
    await expect.poll(async () => await imageLocator(page).getAttribute('src')).toContain('thumbnail');

    step('Get initial image source');
    const initialSrc = await imageLocator(page).getAttribute('src');

    step('Replace asset');
    await utils.replaceAsset(admin.accessToken, asset.id);

    step('Check that image source has changed');
    await expect.poll(async () => await imageLocator(page).getAttribute('src')).not.toBe(initialSrc);
  });
});
