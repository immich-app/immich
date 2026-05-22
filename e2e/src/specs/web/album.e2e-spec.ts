import { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { testAssetDir, utils } from 'src/utils';

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
});
