import { LoginResponseDto, SharedLinkType } from '@immich/sdk';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { testAssetDir, utils } from 'src/utils';

const closeFromAppBar = async (page: Page) => {
  const closeButton = page.locator('#asset-selection-app-bar').getByLabel('Close');
  await expect(closeButton).toBeVisible();
  await closeButton.click();
};

test.describe('Album', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  test(`doesn't delete album after canceling add assets`, async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/albums');
    await page.getByRole('button', { name: 'Create album' }).click();
    await page.getByRole('button', { name: 'Select photos' }).click();
    await page.getByRole('button', { name: 'Close' }).click();

    await page.reload();
    await page.getByRole('button', { name: 'Select photos' }).waitFor();
  });

  test('should keep map view open after viewing an asset from the map and going back', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);

    const imagePath = `${testAssetDir}/metadata/gps-position/thompson-springs.jpg`;
    const mapAsset = await utils.createAsset(admin.accessToken, {
      assetData: {
        bytes: readFileSync(imagePath),
        filename: 'thompson-springs.jpg',
      },
    });

    await utils.waitForQueueFinish(admin.accessToken, 'metadataExtraction');

    const mapAlbum = await utils.createAlbum(admin.accessToken, {
      albumName: 'Map Test Album',
      assetIds: [mapAsset.id],
    });

    await page.goto(`/albums/${mapAlbum.id}`);
    const mapButton = page.getByRole('button', { name: 'Map' });
    await expect(mapButton).toBeVisible();
    await mapButton.click();

    const mapModal = page.getByRole('dialog');
    await expect(mapModal).toBeVisible();

    const mapMarker = mapModal.getByRole('img', { name: /Map marker/i }).first();
    await expect(mapMarker).toBeVisible();
    await mapMarker.click();

    await page.waitForSelector('#immich-asset-viewer');
    await page.getByRole('button', { name: 'Go back' }).click();

    await expect(page.locator('#immich-asset-viewer')).not.toBeVisible();
    await expect(mapModal).toBeVisible();
  });

  test('navigates back to /albums from an album detail', async ({ context, page }) => {
    const album = await utils.createAlbum(admin.accessToken, {
      albumName: `Albums Backstack ${Date.now()}`,
    });

    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/albums');
    await expect(page).toHaveURL('/albums');

    const albumLink = page.locator('main').locator(`a[href="/albums/${album.id}"]`).first();
    await expect(albumLink).toBeVisible();

    await albumLink.click();
    await expect(page).toHaveURL(`/albums/${album.id}`);

    await closeFromAppBar(page);

    await expect(page).toHaveURL('/albums');
  });

  test('navigates back to /sharing from a shared album detail', async ({ context, page }) => {
    const album = await utils.createAlbum(admin.accessToken, {
      albumName: `Shared Regression ${Date.now()}`,
    });

    await utils.createSharedLink(admin.accessToken, {
      type: SharedLinkType.Album,
      albumId: album.id,
    });

    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/sharing');
    await expect(page).toHaveURL('/sharing');

    const sharedAlbumLink = page.locator('main').locator(`a[href^="/albums/${album.id}"]`).first();
    await expect(sharedAlbumLink).toBeVisible();

    await sharedAlbumLink.click();
    await expect(page).toHaveURL(`/albums/${album.id}`);

    await closeFromAppBar(page);

    await expect(page).toHaveURL('/sharing');
  });

  test('navigates back to /people/:id/photos/:id from album detail opened from people flow', async ({
    context,
    page,
  }) => {
    const asset = await utils.createAsset(admin.accessToken);
    const person = await utils.createPerson(admin.accessToken, {
      name: `Person Backstack ${Date.now()}`,
    });
    await utils.createFace({ assetId: asset.id, personId: person.id });

    const album = await utils.createAlbum(admin.accessToken, {
      albumName: `People Album Backstack ${Date.now()}`,
      assetIds: [asset.id],
    });

    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto('/people');
    await expect(page).toHaveURL('/people');

    const personLink = page.locator('main').locator(`a[href="/people/${person.id}"]`).first();
    await expect(personLink).toBeVisible();
    await personLink.click();

    await expect(page).toHaveURL(`/people/${person.id}`);

    const personAsset = page.locator(`[data-asset-id="${asset.id}"]`).first();
    await expect(personAsset).toBeVisible();
    await personAsset.click();

    await expect(page).toHaveURL(`/people/${person.id}/photos/${asset.id}`);

    // Open info panel to access album link
    await page.getByLabel('Info').click();

    const albumLink = page.locator(`a[href="/albums/${album.id}"]`).first();
    await expect(albumLink).toBeVisible();
    await albumLink.click();

    await expect(page).toHaveURL(`/albums/${album.id}`);

    await closeFromAppBar(page);

    await expect(page).toHaveURL(`/people/${person.id}/photos/${asset.id}`);
  });
});
