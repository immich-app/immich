import { AssetMediaResponseDto, LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { PNG } from 'pngjs';
import { utils } from 'src/utils';

/** Create a solid-color PNG with specific dimensions */
const createSizedPNG = (width: number, height: number): Buffer => {
  const image = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      image.data[idx] = 100; // R
      image.data[idx + 1] = 150; // G
      image.data[idx + 2] = 200; // B
      image.data[idx + 3] = 255; // A
    }
  }
  return PNG.sync.write(image);
};

test.describe('Photo Viewer - Aspect Ratio', () => {
  let admin: LoginResponseDto;
  let wideAsset: AssetMediaResponseDto;
  let tallAsset: AssetMediaResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    // Upload a wide image (600x400, aspect ratio 1.5)
    wideAsset = await utils.createAsset(admin.accessToken, {
      assetData: { bytes: createSizedPNG(600, 400), filename: 'wide.png' },
    });

    // Upload a tall image (400x600, aspect ratio ~0.667)
    tallAsset = await utils.createAsset(admin.accessToken, {
      assetData: { bytes: createSizedPNG(400, 600), filename: 'tall.png' },
    });
  });

  test.beforeEach(async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.waitForLoadState('networkidle');
  });

  test('wide image preserves aspect ratio via object-fit contain', async ({ page }) => {
    await page.goto(`/photos/${wideAsset.id}`);

    const preview = page.getByTestId('preview').filter({ visible: true });
    await expect(preview).toHaveAttribute('src', /.+/);

    const result = await preview.evaluate((img: HTMLImageElement) => {
      const style = globalThis.getComputedStyle(img);
      return {
        objectFit: style.objectFit,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        clientWidth: img.clientWidth,
        clientHeight: img.clientHeight,
      };
    });

    // The image must use object-fit: contain to prevent distortion
    expect(result.objectFit).toBe('contain');

    // The rendered aspect ratio must match the natural aspect ratio
    const naturalRatio = result.naturalWidth / result.naturalHeight;
    const renderedRatio = result.clientWidth / result.clientHeight;
    expect(renderedRatio).toBeCloseTo(naturalRatio, 1);
  });

  test('tall image preserves aspect ratio via object-fit contain', async ({ page }) => {
    await page.goto(`/photos/${tallAsset.id}`);

    const preview = page.getByTestId('preview').filter({ visible: true });
    await expect(preview).toHaveAttribute('src', /.+/);

    const result = await preview.evaluate((img: HTMLImageElement) => {
      const style = globalThis.getComputedStyle(img);
      return {
        objectFit: style.objectFit,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        clientWidth: img.clientWidth,
        clientHeight: img.clientHeight,
      };
    });

    expect(result.objectFit).toBe('contain');

    const naturalRatio = result.naturalWidth / result.naturalHeight;
    const renderedRatio = result.clientWidth / result.clientHeight;
    expect(renderedRatio).toBeCloseTo(naturalRatio, 1);
  });
});
