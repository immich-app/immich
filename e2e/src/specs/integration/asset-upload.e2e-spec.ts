import { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import type { Socket } from 'socket.io-client';
import { utils } from 'src/utils';

test.describe('Asset Upload Integration', () => {
  let admin: LoginResponseDto;
  let websocket: Socket;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    websocket = await utils.connectWebsocket(admin.accessToken);
  });

  test.afterAll(() => {
    utils.disconnectWebsocket(websocket);
  });

  test('uploaded asset appears in timeline', async ({ context, page }) => {
    const asset = await utils.createAsset(admin.accessToken);
    await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset.id });

    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/photos');

    await page.locator(`[data-asset-id="${asset.id}"]`).waitFor();
    await expect(page.locator(`[data-asset-id="${asset.id}"]`)).toBeVisible();
  });

  test('asset detail view shows metadata', async ({ context, page }) => {
    const asset = await utils.createAsset(admin.accessToken);
    await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset.id });

    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/photos/${asset.id}`);
    await page.waitForSelector('#immich-asset-viewer');

    await page.getByRole('button', { name: 'Info' }).click();
    await expect(page.locator('#detail-panel')).toBeVisible();
  });

  test('asset can be deleted and disappears from timeline', async ({ context, page }) => {
    const asset = await utils.createAsset(admin.accessToken);
    await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset.id });

    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/photos');

    await page.locator(`[data-asset-id="${asset.id}"]`).waitFor();

    // Select and delete
    await page.locator(`[data-asset-id="${asset.id}"]`).hover();
    await page.waitForSelector(`[data-asset-id="${asset.id}"] [role="checkbox"]`);
    await page.locator(`[data-asset-id="${asset.id}"] [role="checkbox"]`).click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Trash' }).click();

    await utils.waitForWebsocketEvent({ event: 'assetDelete', id: asset.id });

    // Asset should no longer be in timeline
    await expect(page.locator(`[data-asset-id="${asset.id}"]`)).toHaveCount(0);
  });
});
