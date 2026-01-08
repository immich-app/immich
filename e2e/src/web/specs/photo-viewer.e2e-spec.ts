import { AssetMediaResponseDto, LoginResponseDto } from '@immich/sdk';
import { Page, expect, test } from '@playwright/test';
import { utils } from 'src/utils';

function imageLocator(page: Page) {
  return page.locator('[data-photo]');
}
test.describe('Photo Viewer', () => {
  let admin: LoginResponseDto;
  let asset: AssetMediaResponseDto;
  let rawAsset: AssetMediaResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    asset = await utils.createAsset(admin.accessToken);
    rawAsset = await utils.createAsset(admin.accessToken, { assetData: { filename: 'test.arw' } });
  });

  test.beforeEach(async ({ context, page }) => {
    // before each test, login as user
    await utils.setAuthCookies(context, admin.accessToken);
    await page.waitForLoadState('networkidle');
  });

  test('loads original photo when zoomed', async ({ page }) => {
    await page.goto(`/photos/${asset.id}`);
    await expect(imageLocator(page)).toHaveAttribute('src', /thumbnail/);
    const box = await imageLocator(page).boundingBox();
    expect(box).toBeTruthy();
    const { x, y, width, height } = box!;
    await page.mouse.move(x + width / 2, y + height / 2);
    await page.mouse.wheel(0, -1);
    await expect(imageLocator(page)).toHaveAttribute('src', /original/);
  });

  test('loads fullsize image when zoomed and original is web-incompatible', async ({ page }) => {
    await page.goto(`/photos/${rawAsset.id}`);
    await expect(imageLocator(page)).toHaveAttribute('src', /thumbnail/);
    const box = await imageLocator(page).boundingBox();
    expect(box).toBeTruthy();
    const { x, y, width, height } = box!;
    await page.mouse.move(x + width / 2, y + height / 2);
    await page.mouse.wheel(0, -1);
    await expect(imageLocator(page)).toHaveAttribute('src', /fullsize/);
  });

  test('reloads photo when checksum changes', async ({ page }) => {
    await page.goto(`/photos/${asset.id}`);
    const initialSrc = (await imageLocator(page).getAttribute('src')) ?? '';
    await utils.replaceAsset(admin.accessToken, asset.id);
    await expect(imageLocator(page)).not.toHaveAttribute('src', initialSrc);
  });
});
