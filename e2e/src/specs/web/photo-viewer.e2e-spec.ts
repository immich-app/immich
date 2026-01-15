import { AssetMediaResponseDto, LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

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

    const thumbnail = page.getByTestId('thumbnail').filter({ visible: true });
    const original = page.getByTestId('original').filter({ visible: true });

    await expect(thumbnail).toHaveAttribute('src', /thumbnail/);
    const box = await thumbnail.boundingBox();
    expect(box).toBeTruthy();
    const { x, y, width, height } = box!;
    await page.mouse.move(x + width / 2, y + height / 2);
    await page.mouse.wheel(0, -1);
    await expect(original).toBeInViewport();
    await expect(original).toHaveAttribute('src', /original/);
  });

  test('loads fullsize image when zoomed and original is web-incompatible', async ({ page }) => {
    await page.goto(`/photos/${rawAsset.id}`);

    const thumbnail = page.getByTestId('thumbnail').filter({ visible: true });
    const original = page.getByTestId('original').filter({ visible: true });

    await expect(thumbnail).toHaveAttribute('src', /thumbnail/);
    const box = await thumbnail.boundingBox();
    expect(box).toBeTruthy();
    const { x, y, width, height } = box!;
    await page.mouse.move(x + width / 2, y + height / 2);
    await page.mouse.wheel(0, -1);
    await expect(original).toHaveAttribute('src', /fullsize/);
  });

  test('reloads photo when checksum changes', async ({ page }) => {
    await page.goto(`/photos/${asset.id}`);

    const thumbnail = page.getByTestId('thumbnail').filter({ visible: true });
    const preview = page.getByTestId('preview').filter({ visible: true });

    await expect(thumbnail).toHaveAttribute('src', /thumbnail/);
    const initialSrc = await thumbnail.getAttribute('src');
    await utils.replaceAsset(admin.accessToken, asset.id);
    await expect(preview).not.toHaveAttribute('src', initialSrc!);
  });
});
