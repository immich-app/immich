import { LoginResponseDto, createAlbum } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import type { Socket } from 'socket.io-client';
import { asBearerAuth, utils } from 'src/utils';

test.describe('Album Management Integration', () => {
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

  test('create album and verify it appears in albums list', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/albums');
    await page.getByRole('button', { name: 'Create album' }).click();

    // Should navigate to the new album page
    await expect(page).toHaveURL(/\/albums\//);
    await page.getByRole('button', { name: 'Select photos' }).waitFor();

    // Go back to albums list and verify it exists
    await page.goto('/albums');
    await page.getByText('Untitled').waitFor();
  });

  test('add asset to album and verify it appears', async ({ context, page }) => {
    const asset = await utils.createAsset(admin.accessToken);
    await utils.waitForWebsocketEvent({ event: 'assetUpload', id: asset.id });

    const album = await createAlbum(
      { createAlbumDto: { albumName: 'Integration Test Album', assetIds: [asset.id] } },
      { headers: asBearerAuth(admin.accessToken) },
    );

    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/albums/${album.id}`);

    await page.getByRole('heading', { name: 'Integration Test Album' }).waitFor();
    await page.locator(`[data-asset-id="${asset.id}"]`).waitFor();
    await expect(page.locator(`[data-asset-id="${asset.id}"]`)).toBeVisible();
  });

  test('rename album via UI and verify persistence', async ({ context, page }) => {
    const album = await createAlbum(
      { createAlbumDto: { albumName: 'Original Name' } },
      { headers: asBearerAuth(admin.accessToken) },
    );

    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/albums/${album.id}`);

    // Click album title to edit
    await page.getByRole('heading', { name: 'Original Name' }).click();
    const titleInput = page.getByRole('textbox');
    await titleInput.clear();
    await titleInput.fill('Renamed Album');
    await titleInput.press('Enter');

    // Reload and verify the name persisted
    await page.reload();
    await page.getByRole('heading', { name: 'Renamed Album' }).waitFor();
  });

  test('album is accessible from albums page after creation via API', async ({ context, page }) => {
    const album = await createAlbum(
      { createAlbumDto: { albumName: 'API Created Album' } },
      { headers: asBearerAuth(admin.accessToken) },
    );

    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/albums');

    await page.getByText('API Created Album').waitFor();
    await page.getByText('API Created Album').click();
    await expect(page).toHaveURL(`/albums/${album.id}`);
  });
});
