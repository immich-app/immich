import {
  AlbumResponseDto,
  AssetMediaResponseDto,
  LoginResponseDto,
  SharedLinkResponseDto,
  SharedLinkType,
  createAlbum,
} from '@immich/sdk';
import { test } from '@playwright/test';
import { asBearerAuth, utils } from 'src/utils';

test.describe('Shared Links', () => {
  let admin: LoginResponseDto;
  let asset: AssetMediaResponseDto;
  let album: AlbumResponseDto;
  let sharedLink: SharedLinkResponseDto;
  let sharedLinkPassword: SharedLinkResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    asset = await utils.createAsset(admin.accessToken);
    album = await createAlbum(
      {
        createAlbumDto: {
          albumName: 'Test Album',
          assetIds: [asset.id],
        },
      },
      { headers: asBearerAuth(admin.accessToken) },
    );
    sharedLink = await utils.createSharedLink(admin.accessToken, {
      type: SharedLinkType.Album,
      albumId: album.id,
    });
    sharedLinkPassword = await utils.createSharedLink(admin.accessToken, {
      type: SharedLinkType.Album,
      albumId: album.id,
      password: 'test-password',
    });
  });

  test('download from a shared link', async ({ page }) => {
    await page.goto(`/share/${sharedLink.key}`);
    await page.getByRole('heading', { name: 'Test Album' }).waitFor();
    await page.locator(`[data-asset-id="${asset.id}"]`).hover();
    await page.waitForSelector('#asset-group-by-date svg');
    await page.getByRole('checkbox').click();
    await page.getByRole('button', { name: 'Download' }).click();
    await page.getByText('DOWNLOADING', { exact: true }).waitFor();
  });

  test('download all from shared link', async ({ page }) => {
    await page.goto(`/share/${sharedLink.key}`);
    await page.getByRole('heading', { name: 'Test Album' }).waitFor();
    await page.getByRole('button', { name: 'Download' }).click();
    await page.getByText('DOWNLOADING', { exact: true }).waitFor();
  });

  test('enter password for a shared link', async ({ page }) => {
    await page.goto(`/share/${sharedLinkPassword.key}`);
    await page.getByPlaceholder('Password').fill('test-password');
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByRole('heading', { name: 'Test Album' }).waitFor();
  });

  test('show error for invalid shared link', async ({ page }) => {
    await page.goto('/share/invalid');
    await page.getByRole('heading', { name: 'Invalid share key' }).waitFor();
  });

  test('auth on navigation from shared link to timeline', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);

    await page.goto(`/share/${sharedLink.key}`);
    await page.getByRole('heading', { name: 'Test Album' }).waitFor();

    await page.locator('a[href="/"]').click();
    await page.waitForURL('/photos');
    await page.locator(`[data-asset-id="${asset.id}"]`).waitFor();
  });
});
