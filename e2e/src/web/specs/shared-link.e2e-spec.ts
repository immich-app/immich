import {
  AlbumResponseDto,
  AssetFileUploadResponseDto,
  LoginResponseDto,
  SharedLinkResponseDto,
  SharedLinkType,
  createAlbum,
} from '@immich/sdk';
import { test } from '@playwright/test';
import { asBearerAuth, utils } from 'src/utils';

test.describe('Shared Links', () => {
  let admin: LoginResponseDto;
  let asset: AssetFileUploadResponseDto;
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
    await page.locator('.group > div').first().hover();
    await page.waitForSelector('#asset-group-by-date svg');
    await page.getByRole('checkbox').click();
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
});
