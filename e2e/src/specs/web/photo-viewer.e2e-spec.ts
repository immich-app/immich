import { AssetMediaResponseDto, LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import type { Socket } from 'socket.io-client';
import { utils } from 'src/utils';

test.describe('Photo Viewer', () => {
  let admin: LoginResponseDto;
  let asset: AssetMediaResponseDto;
  let rawAsset: AssetMediaResponseDto;
  let websocket: Socket;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    asset = await utils.createAsset(admin.accessToken);
    rawAsset = await utils.createAsset(admin.accessToken, { assetData: { filename: 'test.arw' } });
    websocket = await utils.connectWebsocket(admin.accessToken);
  });

  test.afterAll(() => {
    utils.disconnectWebsocket(websocket);
  });

  test.beforeEach(async ({ context, page }) => {
    // before each test, login as user
    await utils.setAuthCookies(context, admin.accessToken);
    await page.waitForLoadState('networkidle');
  });

  test('loads original photo when zoomed', async ({ page }) => {
    await page.goto(`/photos/${asset.id}`);

    const preview = page.getByTestId('preview').filter({ visible: true });
    await expect(preview).toHaveAttribute('src', /.+/);

    const originalResponse = page.waitForResponse((response) => response.url().includes('/original'));

    const { width, height } = page.viewportSize()!;
    await page.mouse.move(width / 2, height / 2);
    await page.mouse.wheel(0, -1);

    await originalResponse;

    const original = page.getByTestId('original').filter({ visible: true });
    await expect(original).toHaveAttribute('src', /original/);
  });

  test('loads fullsize image when zoomed and original is web-incompatible', async ({ page }) => {
    await page.goto(`/photos/${rawAsset.id}`);

    const preview = page.getByTestId('preview').filter({ visible: true });
    await expect(preview).toHaveAttribute('src', /.+/);

    const fullsizeResponse = page.waitForResponse((response) => response.url().includes('fullsize'));

    const { width, height } = page.viewportSize()!;
    await page.mouse.move(width / 2, height / 2);
    await page.mouse.wheel(0, -1);

    await fullsizeResponse;

    const original = page.getByTestId('original').filter({ visible: true });
    await expect(original).toHaveAttribute('src', /fullsize/);
  });

  test('right-click targets the img element', async ({ page }) => {
    await page.goto(`/photos/${asset.id}`);

    const preview = page.getByTestId('preview').filter({ visible: true });
    await expect(preview).toHaveAttribute('src', /.+/);

    const box = await preview.boundingBox();
    const tagAtCenter = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, {
      x: box!.x + box!.width / 2,
      y: box!.y + box!.height / 2,
    });
    expect(tagAtCenter).toBe('IMG');
  });

  test('reloads photo when checksum changes', async ({ page }) => {
    await page.goto(`/photos/${asset.id}`);

    const preview = page.getByTestId('preview').filter({ visible: true });
    await expect(preview).toHaveAttribute('src', /.+/);
    const initialSrc = await preview.getAttribute('src');

    const websocketEvent = utils.waitForWebsocketEvent({ event: 'assetUpdate', id: asset.id });
    await utils.replaceAsset(admin.accessToken, asset.id);
    await websocketEvent;

    await expect(preview).not.toHaveAttribute('src', initialSrc!);
  });
});
